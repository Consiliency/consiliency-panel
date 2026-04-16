import React, { useRef, useState } from "react";
import { usePanelContext } from "../PanelProvider";
import type { ModeId, ProcessEvent, SubmissionPayload } from "@consiliency/panel-types";

interface SubmitButtonProps {
  modeId: ModeId;
  onDone: (issueUrl: string) => void;
  componentHint?: string;
  submissionEnhancer?: (payload: SubmissionPayload) => SubmissionPayload;
}

type SubmitPhase = "idle" | "submitting" | "classifying" | "creating" | "done" | "error";

const PHASE_LABELS: Record<SubmitPhase, string> = {
  idle: "Submit Issue",
  submitting: "Submitting…",
  classifying: "Classifying…",
  creating: "Creating issue…",
  done: "Done!",
  error: "Failed — retry?",
};

export function SubmitButton({ modeId, onDone, componentHint, submissionEnhancer }: SubmitButtonProps) {
  const { sdk } = usePanelContext();
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const inflightRef = useRef(false);

  const handleSubmit = async () => {
    if (inflightRef.current) return;
    if (phase !== "idle" && phase !== "error") return;
    inflightRef.current = true;
    setPhase("submitting");

    try {
      const metadata = sdk.metadata.collect();
      const consoleErrors = sdk.metadata.collectConsoleErrors();
      const consoleWarnings = sdk.metadata.collectConsoleWarnings();
      sdk.conversation.setMetadata(metadata);

      const basePayload: SubmissionPayload = {
        transcript: sdk.conversation.state.turns.filter((t) => t.content !== "__preview__"),
        metadata,
        screenshotUrl: sdk.conversation.state.screenshotUrl,
        attachmentUrls: sdk.conversation.state.attachmentUrls,
        consoleErrors,
        consoleWarnings,
        repo: sdk.config.repo,
      };
      if (sdk.config.navigationTracking) {
        basePayload.navigationBreadcrumb = sdk.navigation.getBreadcrumb();
      }
      if (componentHint) {
        basePayload.componentHint = componentHint;
      }
      const payload = submissionEnhancer ? submissionEnhancer(basePayload) : basePayload;

      const { id } = await sdk.client.submit(payload);
      setPhase("classifying");

      await sdk.client.streamProcess(id, (event: ProcessEvent) => {
        if (event.type === "progress") {
          const msg = event.message?.toLowerCase() ?? "";
          if (msg.includes("classif")) setPhase("classifying");
          else if (msg.includes("enrich") || msg.includes("format")) setPhase("classifying");
          else if (msg.includes("creating") || msg.includes("issue")) setPhase("creating");
          else if (msg.includes("routing")) setPhase("classifying");
        } else if (event.type === "completed") {
          setPhase("done");
          sdk.conversation.markSubmitted();
          onDone(event.issueUrl ?? "");
        } else if (event.type === "error") {
          setPhase("error");
        }
      }, { repo: sdk.config.repo, panelRepo: sdk.config.panelRepo });
    } catch {
      setPhase("error");
    } finally {
      inflightRef.current = false;
    }
  };

  const isLoading = phase !== "idle" && phase !== "error" && phase !== "done";

  return (
    <button
      className="panel-submit-btn"
      onClick={handleSubmit}
      disabled={isLoading || phase === "done"}
    >
      {isLoading && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span className="panel-spinner" />
        {PHASE_LABELS[phase]}
      </span>}
      {!isLoading && PHASE_LABELS[phase]}
    </button>
  );
}
