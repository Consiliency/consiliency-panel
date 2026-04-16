import React, { useState } from "react";
import { captureScreenshot, blobToDataUrl } from "@consiliency/panel-core";
import { usePanelContext } from "../PanelProvider";
import { AnnotationEditor } from "./AnnotationEditor";

interface ScreenshotCaptureProps {
  onCaptured: (url: string) => void;
}

/** Screenshot button + annotation workflow */
export function ScreenshotCapture({ onCaptured }: ScreenshotCaptureProps) {
  const { sdk, panelElementRef } = usePanelContext();
  const [capturing, setCapturing] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [pendingPanelBlob, setPendingPanelBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async () => {
    setCapturing(true);
    setError(null);
    try {
      const { page, panel } = await captureScreenshot({ panelEl: panelElementRef?.current ?? null });
      setPendingPanelBlob(panel ?? null);
      const url = await blobToDataUrl(page);
      setDataUrl(url);
    } catch {
      setError("Screenshot capture failed");
    } finally {
      setCapturing(false);
    }
  };

  const handleAnnotationDone = async (blob: Blob) => {
    setDataUrl(null);
    setError(null);
    const ts = Date.now();
    const pageName = `screenshot-page-${ts}.png`;
    try {
      const url = await sdk.client.uploadAttachment(blob, pageName);
      sdk.conversation.setScreenshotUrl(url);
      sdk.conversation.addAttachment({ url, type: "screenshot", name: pageName, screenshotKind: "page" });
      // Create object URL just for thumbnail display
      setThumbnail(URL.createObjectURL(blob));
      onCaptured(url);

      // Upload the panel capture in the background as a second attachment so
      // the routing agent can distinguish host-app bugs from panel-widget bugs.
      if (pendingPanelBlob) {
        const panelName = `screenshot-panel-${ts}.png`;
        try {
          const panelUrl = await sdk.client.uploadAttachment(pendingPanelBlob, panelName);
          sdk.conversation.addAttachment({ url: panelUrl, type: "screenshot", name: panelName, screenshotKind: "panel" });
        } catch {
          /* panel upload failed — page screenshot still goes through */
        }
      }
    } catch {
      setError("Upload failed");
    } finally {
      setPendingPanelBlob(null);
    }
  };

  return (
    <>
      {dataUrl && (
        <AnnotationEditor
          imageDataUrl={dataUrl}
          onDone={handleAnnotationDone}
          onCancel={() => setDataUrl(null)}
        />
      )}
      {error && (
        <div className="panel-capture-error" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">×</button>
        </div>
      )}
      {thumbnail ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 0 8px" }}>
          <img src={thumbnail} alt="Screenshot" style={{ width: 48, height: 32, objectFit: "cover", borderRadius: 4, border: "1px solid var(--panel-border)" }} />
          <button
            onClick={() => { setThumbnail(null); sdk.conversation.setScreenshotUrl(""); }}
            style={{ fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "var(--panel-fg)", opacity: 0.6 }}
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          className="panel-attach-btn"
          aria-label="Add screenshot"
          onClick={handleCapture}
          disabled={capturing}
          title="Add screenshot"
        >
          {capturing ? (
            <span className="panel-spinner" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </button>
      )}
    </>
  );
}
