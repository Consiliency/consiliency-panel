import React from "react";
import type { IssuePreview } from "@consiliency/panel-types";

interface PreviewCardProps {
  preview: IssuePreview;
}

export function PreviewCard({ preview }: PreviewCardProps) {
  return (
    <div className="panel-preview">
      {preview.screenshotUrl && (
        <img
          src={preview.screenshotUrl}
          alt="Screenshot"
          style={{ width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }}
        />
      )}
      <div className="panel-preview-summary">{preview.plainSummary}</div>
      {preview.technicalDetails && (
        <details className="panel-preview-details">
          <summary>Technical details</summary>
          <div className="panel-preview-details-content">{preview.technicalDetails}</div>
        </details>
      )}
    </div>
  );
}
