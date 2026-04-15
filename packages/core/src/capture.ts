/**
 * Captures a screenshot of the current document using modern-screenshot
 * in Web Worker mode to avoid blocking the main thread.
 *
 * When `panelEl` is provided, the page capture filters that element out
 * (so the panel widget doesn't appear in its own screenshot) and an
 * additional capture of the panel itself is returned alongside.
 */
export async function captureScreenshot(opts: {
  panelEl?: Element | null;
} = {}): Promise<{ page: Blob; panel?: Blob }> {
  const { domToBlob } = await import("modern-screenshot");
  const { panelEl } = opts;

  const pagePromise = domToBlob(document.documentElement, {
    quality: 0.9,
    type: "image/png",
    timeout: 10000,
    filter: panelEl ? (node: Node) => node !== panelEl : undefined,
  });

  if (!panelEl) {
    const page = await pagePromise;
    if (!page) throw new Error("Screenshot capture returned empty blob");
    return { page };
  }

  const panelPromise = domToBlob(panelEl, {
    quality: 0.9,
    type: "image/png",
    timeout: 10000,
  });

  const [pageResult, panelResult] = await Promise.allSettled([pagePromise, panelPromise]);

  const page = pageResult.status === "fulfilled" ? pageResult.value : null;
  const panel = panelResult.status === "fulfilled" ? panelResult.value : null;

  if (!page && !panel) {
    throw new Error("Screenshot capture: both page and panel captures failed");
  }
  // If page failed but panel succeeded, fall back: use panel as page (legacy callers
  // that ignore the panel field still get something usable)
  return {
    page: (page ?? panel) as Blob,
    panel: panel ?? undefined,
  };
}

/** Converts a Blob to a data URL (for preview thumbnails only — never for upload) */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
