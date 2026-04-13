/**
 * Captures a screenshot of the current document using modern-screenshot
 * in Web Worker mode to avoid blocking the main thread.
 */
export async function captureScreenshot(): Promise<Blob> {
  // Dynamic import so the worker payload is only loaded when needed
  const { domToBlob } = await import("modern-screenshot");

  const blob = await domToBlob(document.body, {
    quality: 0.9,
    type: "image/png",
    // workerUrl can be configured by the consumer for Web Worker offloading
    // Leave unset here for maximum bundler compatibility
  });

  if (!blob) {
    throw new Error("Screenshot capture returned empty blob");
  }

  return blob;
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
