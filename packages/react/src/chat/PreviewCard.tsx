import React, { useState } from "react";
import type {
  IssueDraft,
  IssueKind,
  IssuePreview,
  IssueSeverity,
} from "@consiliency/panel-types";

interface ReadOnlyProps {
  preview: IssuePreview;
  editable?: false;
}

interface EditableProps {
  editable: true;
  draft: IssueDraft;
  onDraftChange: (draft: IssueDraft) => void;
  onSubmit: () => Promise<void> | void;
  onRequestChanges?: (text: string) => void;
  screenshotUrl?: string;
  /** When mode is "comment", hide title + kind inputs — body is the only field */
  mode?: "issue" | "comment";
}

type PreviewCardProps = ReadOnlyProps | EditableProps;

const SEVERITIES: IssueSeverity[] = ["blocker", "high", "medium", "low"];
const KINDS: IssueKind[] = ["bug", "feature", "feedback", "other"];

export function PreviewCard(props: PreviewCardProps) {
  if (!props.editable) {
    const { preview } = props;
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

  return <EditableDraft {...props} />;
}

function EditableDraft({
  draft,
  onDraftChange,
  onSubmit,
  onRequestChanges,
  screenshotUrl,
  mode = "issue",
}: EditableProps) {
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [reviseText, setReviseText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const commentMode = mode === "comment";

  const doSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit();
      setConfirm(null);
    } catch (err) {
      const e = err as { status?: number; requiresConfirm?: boolean; reason?: string; message?: string };
      if (e?.status === 422 && e.requiresConfirm) {
        setConfirm(e.reason ?? "This draft looks thin. Submit anyway?");
      } else {
        setError(e?.message ?? "Failed to submit");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || (commentMode ? !draft.body.trim() : !draft.title.trim() || !draft.body.trim());

  return (
    <div className="panel-preview panel-draft-edit">
      {screenshotUrl && (
        <img
          src={screenshotUrl}
          alt="Screenshot"
          style={{ width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }}
        />
      )}
      {!commentMode && (
        <input
          className="panel-draft-title"
          type="text"
          value={draft.title}
          placeholder="Issue title"
          onChange={(e) => onDraftChange({ ...draft, title: e.target.value })}
        />
      )}
      <textarea
        className="panel-draft-body"
        value={draft.body}
        placeholder={commentMode ? "Comment body" : "What happened? Steps to reproduce, expected vs actual…"}
        rows={6}
        onChange={(e) => onDraftChange({ ...draft, body: e.target.value })}
      />
      {!commentMode && (
        <div className="panel-draft-row">
          <label className="panel-draft-label">
            Severity
            <select
              value={draft.severity}
              onChange={(e) => onDraftChange({ ...draft, severity: e.target.value as IssueSeverity })}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="panel-draft-label">
            Kind
            <select
              value={draft.kind}
              onChange={(e) => onDraftChange({ ...draft, kind: e.target.value as IssueKind })}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {confirm && (
        <div className="panel-draft-confirm">
          <div>{confirm}</div>
          <div className="panel-draft-confirm-actions">
            <button
              className="panel-draft-submit"
              onClick={async () => {
                setSubmitting(true);
                try {
                  await onSubmit();
                  setConfirm(null);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
            >
              Submit anyway
            </button>
            <button
              className="panel-draft-cancel"
              onClick={() => setConfirm(null)}
              disabled={submitting}
            >
              Keep editing
            </button>
          </div>
        </div>
      )}

      {error && <div className="panel-draft-error">{error}</div>}

      {!confirm && (
        <button
          className="panel-draft-submit"
          onClick={doSubmit}
          disabled={disabled}
        >
          {submitting ? "Submitting…" : commentMode ? "Post comment" : "Submit issue"}
        </button>
      )}

      {onRequestChanges && !confirm && (
        <div className="panel-draft-revise">
          <input
            type="text"
            className="panel-draft-revise-input"
            value={reviseText}
            placeholder="Or ask the agent to revise…"
            onChange={(e) => setReviseText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && reviseText.trim()) {
                onRequestChanges(reviseText.trim());
                setReviseText("");
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
