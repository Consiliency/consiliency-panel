import React, { useEffect, useRef, useState } from "react";
import { usePanelContext } from "../PanelProvider";
import { PreviewCard } from "./PreviewCard";
import { SubmitButton } from "./SubmitButton";
import { ScreenshotCapture } from "../capture/ScreenshotCapture";
import { FileAttachment } from "../input/FileAttachment";
import type {
  ConversationTurn,
  IssueDraft,
  IssuePreview,
  ModeId,
  ProcessEvent,
  SubmissionPayload,
} from "@consiliency/panel-types";

interface PanelChatProps {
  modeId: ModeId;
  componentHint?: string;
  submissionEnhancer?: (payload: SubmissionPayload) => SubmissionPayload;
  renderInputBarExtras?: () => React.ReactNode;
}

interface CompletedState {
  issueUrl: string;
  issueNumber?: number;
}

export function PanelChat({ modeId, componentHint, submissionEnhancer, renderInputBarExtras }: PanelChatProps) {
  const { sdk } = usePanelContext();
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [preview, setPreview] = useState<IssuePreview | null>(null);
  const [draft, setDraft] = useState<IssueDraft | null>(null);
  const [phase, setPhase] = useState<string>("greeting");
  const [clarifyOptions, setClarifyOptions] = useState<string[] | undefined>(undefined);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState<CompletedState | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [commentDraftBody, setCommentDraftBody] = useState<string>("");
  const [commentPosted, setCommentPosted] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);
  const submitInflightRef = useRef(false);

  const syncFromSdk = () => {
    setTurns([...sdk.conversation.state.turns]);
    setDraft(sdk.conversation.state.draft ?? null);
    setPhase(sdk.conversation.state.phase);
    setClarifyOptions(sdk.conversation.state.clarifyOptions);
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // If switching to a restored session, the engine already has turns —
    // sync from it and skip the fresh start() (which would clobber state).
    if (sdk.conversation.state.turns.length > 0) {
      syncFromSdk();
      try {
        sdk.conversation.setMetadata(sdk.metadata.collect());
      } catch {
        /* no-op */
      }
      return () => {
        started.current = false;
      };
    }

    sdk.conversation.reset();
    setTurns([]);
    setPreview(null);
    setDraft(null);
    setCompleted(null);
    setCommentPosted(null);

    // Ensure metadata is set before any agentic turn
    try {
      sdk.conversation.setMetadata(sdk.metadata.collect());
    } catch {
      /* metadata collector may not be ready during SSR — no-op */
    }

    sdk.conversation.start(modeId).then(() => {
      syncFromSdk();
    }).catch(() => {
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, preview, draft]);

  const sendUserText = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    try {
      sdk.conversation.setMetadata(sdk.metadata.collect());
      if (phase === "commenting") {
        await sdk.conversation.respondToComment(text);
        setCommentDraftBody(sdk.conversation.getCommentDraftBody() ?? commentDraftBody);
      } else {
        const response = await sdk.conversation.respond(modeId, text);
        if (response.content === "__preview__") {
          setPreview(sdk.conversation.getPreview());
        }
      }
      syncFromSdk();
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    await sendUserText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDone = (issueUrl: string, issueNumber?: number) => {
    setCompleted({ issueUrl, issueNumber });
  };

  const handleReset = () => {
    started.current = false;
    setCompleted(null);
    setCommentPosted(null);
    sdk.conversation.reset();
    setTurns([]);
    setPreview(null);
    setDraft(null);
    try {
      sdk.conversation.setMetadata(sdk.metadata.collect());
    } catch {
      /* no-op */
    }
    sdk.conversation.start(modeId).then(() => {
      syncFromSdk();
      started.current = true;
    });
  };

  const submitAgenticDraft = async (confirmBypass = false) => {
    if (submitInflightRef.current) return;
    if (!draft) return;
    submitInflightRef.current = true;
    setSubmitError(null);
    const metadata = sdk.metadata.collect();
    sdk.conversation.setMetadata(metadata);

    // Persist latest inline edits before submission
    if (sdk.conversation.state.submissionId) {
      try {
        await sdk.conversation.patchDraft(draft);
      } catch (e) {
        console.warn("[Panel] patchDraft failed:", e);
      }
    }

    const payload: SubmissionPayload = {
      transcript: sdk.conversation.state.turns.filter((t) => t.content !== "__preview__" && t.content !== "__draft__"),
      metadata,
      screenshotUrl: sdk.conversation.state.screenshotUrl,
      attachmentUrls: sdk.conversation.state.attachmentUrls,
      consoleErrors: sdk.metadata.collectConsoleErrors(),
      consoleWarnings: sdk.metadata.collectConsoleWarnings(),
      repo: sdk.config.repo,
      submissionId: sdk.conversation.state.submissionId,
      useDraft: true,
      confirmBypass,
      selectedModelId: sdk.conversation.state.selectedModelId,
    };
    if (sdk.config.navigationTracking) {
      payload.navigationBreadcrumb = sdk.navigation.getBreadcrumb();
    }
    if (componentHint) payload.componentHint = componentHint;
    const finalPayload = submissionEnhancer ? submissionEnhancer(payload) : payload;

    try {
      const { id } = await sdk.client.submit(finalPayload);
      let pipelineError: string | null = null;
      await sdk.client.streamProcess(id, (event: ProcessEvent) => {
        if (event.type === "completed") {
          sdk.conversation.markSubmitted(event.issueUrl, event.issueNumber);
          setCompleted({ issueUrl: event.issueUrl ?? "", issueNumber: event.issueNumber });
        } else if (event.type === "error") {
          pipelineError = event.message ?? "Pipeline failed";
        }
      }, { repo: sdk.config.repo, panelRepo: sdk.config.panelRepo });
      if (pipelineError) {
        throw new Error(pipelineError);
      }
    } finally {
      submitInflightRef.current = false;
    }
  };

  const requestDraftChanges = async (text: string) => {
    await sendUserText(text);
  };

  const startCommentSession = async () => {
    if (!completed?.issueNumber) return;
    const issueBody = draft?.body ?? "";
    await sdk.conversation.startCommentSession(
      completed.issueNumber,
      completed.issueUrl,
      issueBody,
    );
    syncFromSdk();
    setCompleted(null);
    setCommentDraftBody("");
  };

  const approveComment = async () => {
    const body = commentDraftBody.trim();
    if (!body) return;
    const result = await sdk.conversation.approveComment(body);
    setCommentPosted(result.commentUrl);
  };

  const isAgentic = sdk.conversation.state.mode === "agentic";

  // Terminal "issue created" screen
  if (completed && phase !== "commenting") {
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
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {completed.issueNumber && isAgentic && (
            <button
              onClick={startCommentSession}
              style={{ fontSize: 13, background: "var(--panel-accent)", color: "var(--panel-accent-fg)", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}
            >
              Request changes
            </button>
          )}
          <button
            onClick={handleReset}
            style={{ fontSize: 13, background: "none", border: "1px solid var(--panel-border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "var(--panel-fg)" }}
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  // Comment posted confirmation
  if (commentPosted) {
    return (
      <div className="panel-chat" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <p style={{ fontSize: 14 }}>Comment posted!</p>
        <a href={commentPosted} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--panel-accent)" }}>
          View on GitHub →
        </a>
        <button
          onClick={handleReset}
          style={{ marginTop: 12, fontSize: 13, background: "none", border: "1px solid var(--panel-border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "var(--panel-fg)" }}
        >
          Submit another
        </button>
      </div>
    );
  }

  const visibleTurns = turns.filter((t) => t.content !== "__preview__" && t.content !== "__draft__");
  const inDrafting = phase === "drafting";
  const inCommenting = phase === "commenting";
  const inScriptedPreview = phase === "preview";

  const hideInput = inDrafting || inScriptedPreview;

  return (
    <>
      <div className="panel-chat">
        {visibleTurns.map((turn, i) => (
          <div key={i} className={`panel-message ${turn.role} ${turn.kind ?? ""}`}>
            {turn.content}
          </div>
        ))}

        {clarifyOptions && clarifyOptions.length > 0 && !isLoading && (
          <div className="panel-clarify-options">
            {clarifyOptions.map((opt) => (
              <button
                key={opt}
                className="panel-clarify-option"
                onClick={() => sendUserText(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {isAgentic && inDrafting && draft && (
          <PreviewCard
            editable
            draft={draft}
            onDraftChange={(d) => {
              setDraft(d);
              sdk.conversation.updateDraft(d);
            }}
            onSubmit={() => submitAgenticDraft(Boolean(submitError))}
            onRequestChanges={requestDraftChanges}
            screenshotUrl={sdk.conversation.state.screenshotUrl}
          />
        )}

        {isAgentic && inCommenting && (
          <PreviewCard
            editable
            mode="comment"
            draft={{
              title: "",
              body: commentDraftBody,
              severity: "medium",
              kind: "feedback",
            }}
            onDraftChange={(d) => setCommentDraftBody(d.body)}
            onSubmit={approveComment}
          />
        )}

        {!isAgentic && inScriptedPreview && preview && (
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

      {!hideInput && (
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
