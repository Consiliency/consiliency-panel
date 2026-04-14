import React, { useEffect, useRef, useState } from "react";
import { usePanelContext } from "../PanelProvider";
import { PreviewCard } from "./PreviewCard";
import { SubmitButton } from "./SubmitButton";
import { ScreenshotCapture } from "../capture/ScreenshotCapture";
import { FileAttachment } from "../input/FileAttachment";
import type { ConversationTurn, IssuePreview, ModeId, SubmissionPayload } from "@consiliency/panel-types";

interface PanelChatProps {
  modeId: ModeId;
  componentHint?: string;
  submissionEnhancer?: (payload: SubmissionPayload) => SubmissionPayload;
  renderInputBarExtras?: () => React.ReactNode;
}

interface CompletedState {
  issueUrl: string;
}

export function PanelChat({ modeId, componentHint, submissionEnhancer, renderInputBarExtras }: PanelChatProps) {
  const { sdk } = usePanelContext();
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [preview, setPreview] = useState<IssuePreview | null>(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState<CompletedState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);

  // Start conversation when component mounts or modeId changes
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    sdk.conversation.reset();
    setTurns([]);
    setPreview(null);
    setCompleted(null);

    sdk.conversation.start(modeId).then((firstTurn) => {
      setTurns([firstTurn]);
    }).catch(() => {
      // Mode not found — show fallback
      setTurns([{
        role: "assistant",
        content: "Thanks for reaching out! What would you like to report?",
        timestamp: new Date().toISOString(),
      }]);
    });

    return () => {
      started.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, preview]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText("");
    setIsLoading(true);

    try {
      const response = await sdk.conversation.respond(modeId, text);
      const newTurns = [...sdk.conversation.state.turns];
      setTurns(newTurns);

      if (response.content === "__preview__") {
        const p = sdk.conversation.getPreview();
        setPreview(p);
      }
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDone = (issueUrl: string) => {
    setCompleted({ issueUrl });
  };

  const handleReset = () => {
    started.current = false;
    setCompleted(null);
    // Re-trigger start by toggling modeId effect
    sdk.conversation.reset();
    setTurns([]);
    setPreview(null);
    started.current = false;
    // Force re-init
    sdk.conversation.start(modeId).then((firstTurn) => {
      setTurns([firstTurn]);
      started.current = true;
    });
  };

  if (completed) {
    return (
      <div className="panel-chat" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <p style={{ fontSize: 14, marginTop: 8 }}>Issue created!</p>
        {completed.issueUrl && (
          <a href={completed.issueUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--panel-accent)" }}>
            View on GitHub →
          </a>
        )}
        <button
          onClick={handleReset}
          style={{ marginTop: 12, fontSize: 13, background: "none", border: "1px solid var(--panel-border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "var(--panel-fg)" }}
        >
          Submit another
        </button>
      </div>
    );
  }

  const inPreview = sdk.conversation.state.phase === "preview";
  const visibleTurns = turns.filter((t) => t.content !== "__preview__");

  return (
    <>
      <div className="panel-chat">
        {visibleTurns.map((turn, i) => (
          <div key={i} className={`panel-message ${turn.role}`}>
            {turn.content}
          </div>
        ))}

        {preview && (
          <>
            <PreviewCard preview={preview} />
            <SubmitButton
              modeId={modeId}
              onDone={handleDone}
              componentHint={componentHint}
              submissionEnhancer={submissionEnhancer}
            />
          </>
        )}

        {isLoading && (
          <div className="panel-progress">
            <span className="panel-spinner" />
            <span>Thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!inPreview && (
        <div className="panel-input-bar">
          <ScreenshotCapture onCaptured={() => {}} />
          <FileAttachment onUploaded={() => {}} />
          {renderInputBarExtras?.()}
          <textarea
            ref={inputRef}
            className="panel-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            rows={1}
            disabled={isLoading}
          />
          <button
            className="panel-send-btn"
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
