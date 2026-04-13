import React, { useCallback, useState } from "react";
import { usePanelContext } from "../PanelProvider";

interface FileAttachmentProps {
  onUploaded: (url: string, filename: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** Attachment button — click to browse, shows upload progress */
export function FileAttachment({ onUploaded }: FileAttachmentProps) {
  const { sdk } = usePanelContext();
  const [uploading, setUploading] = useState(false);

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      // Silently ignore oversized files — UI should show an error ideally
      return;
    }

    setUploading(true);
    try {
      let blob: Blob = file;

      // Compress images > 1 MB
      if (file.type.startsWith("image/") && file.size > 1024 * 1024) {
        const { default: imageCompression } = await import("browser-image-compression");
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        blob = compressed;
      }

      const url = await sdk.client.uploadAttachment(blob, file.name);
      sdk.conversation.addAttachmentUrl(url);
      onUploaded(url, file.name);
    } catch {
      // Upload failed — silently ignore for now
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      e.target.value = "";
    }
  }, [sdk, onUploaded]);

  return (
    <label
      className={`panel-attach-btn${uploading ? "" : ""}`}
      aria-label="Attach file"
      style={{ cursor: uploading ? "not-allowed" : "pointer" }}
    >
      {uploading ? (
        <span className="panel-spinner" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      )}
      <input
        type="file"
        accept="image/*,.pdf,.txt,.md"
        style={{ display: "none" }}
        onChange={handleChange}
        disabled={uploading}
      />
    </label>
  );
}
