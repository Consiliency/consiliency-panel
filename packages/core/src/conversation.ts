import type {
  AttachmentRef,
  ConversationState,
  ConversationTurn,
  IssueDraft,
  IssuePreview,
  KnownFacts,
  ModeId,
  NavigationEntry,
  SavedSession,
  SubmissionMetadata,
  ToolCall,
} from "@consiliency/panel-types";
import { ModeRegistry } from "./modes";
import type { PanelApiClient } from "./client";

interface ConversationContext {
  repo: string;
  panelRepo?: string;
  githubLogin?: string;
  navigationBreadcrumb?: NavigationEntry[];
  attachmentUrls?: AttachmentRef[];
  componentHint?: string;
}

export class ConversationEngine {
  private registry: ModeRegistry;
  private metadata: SubmissionMetadata | null = null;
  private client: PanelApiClient | null = null;
  private context: ConversationContext | null = null;
  private savedSessions: SavedSession[] = [];
  private currentSessionId: string = makeSessionId();
  private currentModeId: ModeId | null = null;

  state: ConversationState = {
    turns: [],
    phase: "greeting",
    questionIndex: 0,
  };

  constructor(registry: ModeRegistry) {
    this.registry = registry;
  }

  setMetadata(metadata: SubmissionMetadata): void {
    this.metadata = metadata;
  }

  setClient(client: PanelApiClient): void {
    this.client = client;
  }

  setContext(context: ConversationContext): void {
    this.context = context;
  }

  setSelectedModelId(id: string | undefined): void {
    this.state = { ...this.state, selectedModelId: id };
  }

  setSubmissionId(id: string | undefined): void {
    this.state = { ...this.state, submissionId: id };
  }

  setScreenshotUrl(url: string): void {
    this.state = { ...this.state, screenshotUrl: url };
  }

  addAttachment(ref: AttachmentRef): void {
    this.state = {
      ...this.state,
      attachmentUrls: [...(this.state.attachmentUrls ?? []), ref],
    };
  }

  async start(modeId: ModeId): Promise<ConversationTurn> {
    const mode = this.registry.get(modeId);
    this.currentModeId = modeId;
    const greeting: ConversationTurn = {
      role: "assistant",
      content: `I'll help you submit feedback. ${mode.questions[0]?.text ?? "What would you like to report?"}`,
      timestamp: new Date().toISOString(),
      kind: "scripted",
    };
    this.state = {
      ...this.state,
      turns: [greeting],
      phase: "questions",
      questionIndex: 0,
      mode: mode.mode ?? "scripted",
    };
    return greeting;
  }

  async respond(modeId: ModeId, userText: string): Promise<ConversationTurn> {
    const mode = this.registry.get(modeId);
    const userTurn: ConversationTurn = {
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
      kind: "user",
    };

    this.state = {
      ...this.state,
      turns: [...this.state.turns, userTurn],
    };

    if ((mode.mode ?? "scripted") === "agentic") {
      return this.respondAgentic(userText);
    }

    // Scripted path (unchanged)
    const nextIndex = this.state.questionIndex + 1;
    if (nextIndex < mode.questions.length) {
      const nextQuestion = mode.questions[nextIndex];
      const assistantTurn: ConversationTurn = {
        role: "assistant",
        content: nextQuestion.text,
        timestamp: new Date().toISOString(),
        kind: "scripted",
      };
      this.state = {
        ...this.state,
        turns: [...this.state.turns, assistantTurn],
        questionIndex: nextIndex,
      };
      return assistantTurn;
    }

    const previewTurn: ConversationTurn = {
      role: "assistant",
      content: "__preview__",
      timestamp: new Date().toISOString(),
    };
    this.state = {
      ...this.state,
      turns: [...this.state.turns, previewTurn],
      phase: "preview",
    };
    return previewTurn;
  }

  private async respondAgentic(userText: string): Promise<ConversationTurn> {
    if (!this.client) throw new Error("ConversationEngine: client not set");
    if (!this.context) throw new Error("ConversationEngine: context not set");
    if (!this.metadata) throw new Error("ConversationEngine: metadata not set");

    const res = await this.client.nextTurn({
      submissionId: this.state.submissionId,
      userText,
      selectedModelId: this.state.selectedModelId,
      repo: this.context.repo,
      panelRepo: this.context.panelRepo,
      metadata: this.metadata,
      transcript: this.state.turns,
      screenshotUrl: this.state.screenshotUrl,
      attachmentUrls: this.state.attachmentUrls,
      navigationBreadcrumb: this.context.navigationBreadcrumb,
      componentHint: this.context.componentHint,
      githubLogin: this.context.githubLogin,
    });

    if (res.submissionId) {
      this.state = { ...this.state, submissionId: res.submissionId };
    }
    this.state = { ...this.state, knownFacts: res.knownFacts };

    return this.applyToolCall(res.toolCall);
  }

  private applyToolCall(toolCall: ToolCall): ConversationTurn {
    const ts = new Date().toISOString();
    switch (toolCall.type) {
      case "ask_follow_up": {
        const turn: ConversationTurn = {
          role: "assistant",
          content: toolCall.question,
          timestamp: ts,
          kind: "agent",
        };
        this.state = {
          ...this.state,
          turns: [...this.state.turns, turn],
          clarifyOptions: undefined,
        };
        return turn;
      }
      case "clarify_intent": {
        const turn: ConversationTurn = {
          role: "assistant",
          content: toolCall.question,
          timestamp: ts,
          kind: "clarify",
        };
        this.state = {
          ...this.state,
          turns: [...this.state.turns, turn],
          clarifyOptions: toolCall.options,
        };
        return turn;
      }
      case "refuse_off_topic": {
        const turn: ConversationTurn = {
          role: "assistant",
          content: toolCall.redirect,
          timestamp: ts,
          kind: "redirect",
        };
        this.state = {
          ...this.state,
          turns: [...this.state.turns, turn],
          clarifyOptions: undefined,
        };
        return turn;
      }
      case "draft_issue":
      case "revise_draft": {
        const turn: ConversationTurn = {
          role: "assistant",
          content: "__draft__",
          timestamp: ts,
          kind: "draft",
        };
        this.state = {
          ...this.state,
          turns: [...this.state.turns, turn],
          phase: "drafting",
          draft: toolCall.draft,
          clarifyOptions: undefined,
        };
        return turn;
      }
    }
  }

  updateDraft(draft: IssueDraft): void {
    this.state = { ...this.state, draft };
  }

  async patchDraft(draft: IssueDraft): Promise<void> {
    if (!this.client) throw new Error("ConversationEngine: client not set");
    if (!this.state.submissionId) throw new Error("ConversationEngine: no submissionId to patch");
    await this.client.patchDraft(this.state.submissionId, draft);
    this.updateDraft(draft);
  }

  getKnownFacts(): KnownFacts | undefined {
    return this.state.knownFacts;
  }

  getPreview(): IssuePreview | null {
    if (this.state.phase !== "preview") return null;

    const userAnswers = this.state.turns
      .filter((t) => t.role === "user")
      .map((t) => t.content)
      .join(" ");

    return {
      plainSummary: userAnswers.slice(0, 200),
      technicalDetails: this.metadata
        ? `**URL:** ${this.metadata.url}\n**Browser:** ${this.metadata.userAgent}\n**Viewport:** ${this.metadata.viewport.width}×${this.metadata.viewport.height}`
        : "",
      screenshotUrl: this.state.screenshotUrl,
      attachmentUrls: this.state.attachmentUrls,
    };
  }

  markSubmitted(issueUrl?: string, issueNumber?: number): void {
    this.state = {
      ...this.state,
      phase: "submitted",
      issueUrl: issueUrl ?? this.state.issueUrl,
      issueNumber: issueNumber ?? this.state.issueNumber,
    };
  }

  async startCommentSession(issueNumber: number, issueUrl: string, issueBody: string): Promise<void> {
    this.state = {
      ...this.state,
      phase: "commenting",
      issueNumber,
      issueUrl,
      turns: [
        {
          role: "assistant",
          content: `Let's draft a follow-up comment for issue #${issueNumber}. What would you like to add or change?`,
          timestamp: new Date().toISOString(),
          kind: "agent",
        },
      ],
      knownFacts: {},
      draft: undefined,
      clarifyOptions: undefined,
    };
    // Stash issue body for subsequent turns
    this.commentIssueBody = issueBody;
    this.commentDraftBody = undefined;
  }

  private commentIssueBody: string | undefined;
  private commentDraftBody: string | undefined;

  getCommentDraftBody(): string | undefined {
    return this.commentDraftBody;
  }

  async respondToComment(userText: string): Promise<ConversationTurn> {
    if (!this.client) throw new Error("ConversationEngine: client not set");
    if (!this.context) throw new Error("ConversationEngine: context not set");
    const submissionId = this.state.submissionId;
    const issueNumber = this.state.issueNumber;
    const issueUrl = this.state.issueUrl;
    if (!submissionId) throw new Error("ConversationEngine: submissionId required");
    if (!issueNumber || !issueUrl) {
      throw new Error("ConversationEngine: comment session not started");
    }

    const userTurn: ConversationTurn = {
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
      kind: "user",
    };
    this.state = { ...this.state, turns: [...this.state.turns, userTurn] };

    const res = await this.client.nextCommentTurn({
      submissionId,
      issueNumber,
      issueUrl,
      issueBody: this.commentIssueBody ?? "",
      userText,
      transcript: this.state.turns,
      knownFacts: this.state.knownFacts,
      selectedModelId: this.state.selectedModelId,
      repo: this.context.repo,
      panelRepo: this.context.panelRepo,
    });

    this.state = { ...this.state, knownFacts: res.knownFacts };

    if (res.toolCall.type === "draft_issue" || res.toolCall.type === "revise_draft") {
      this.commentDraftBody = res.toolCall.draft.body;
    }

    return this.applyToolCall(res.toolCall);
  }

  async approveComment(body: string): Promise<{ commentUrl: string }> {
    if (!this.client) throw new Error("ConversationEngine: client not set");
    if (!this.state.submissionId) throw new Error("ConversationEngine: submissionId required");
    const result = await this.client.postComment(this.state.submissionId, body);
    return result;
  }

  reset(): void {
    this.state = {
      turns: [],
      phase: "greeting",
      questionIndex: 0,
    };
    this.commentIssueBody = undefined;
    this.commentDraftBody = undefined;
  }

  // ── Saved sessions ─────────────────────────────────────────────────────────

  /**
   * Snapshot the current conversation into the saved-sessions list, then
   * reset to a fresh session. Returns the new (current) session id.
   */
  newSession(): string {
    this.snapshotCurrentIfMeaningful();
    this.currentSessionId = makeSessionId();
    this.reset();
    return this.currentSessionId;
  }

  /**
   * Snapshot the current conversation, then load a previously saved one.
   * The previously-saved session is removed from the saved list and becomes
   * current. Returns the loaded session id.
   */
  switchToSession(id: string): string {
    const target = this.savedSessions.find((s) => s.id === id);
    if (!target) throw new Error(`ConversationEngine: no saved session ${id}`);
    this.snapshotCurrentIfMeaningful();
    this.savedSessions = this.savedSessions.filter((s) => s.id !== id);
    this.currentSessionId = target.id;
    this.currentModeId = target.modeId;
    this.state = { ...target.state };
    return target.id;
  }

  listSavedSessions(): SavedSession[] {
    return [...this.savedSessions];
  }

  getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  /**
   * Drop the saved-sessions list and reset the current session id.
   * Called when the panel is closed entirely (saved sessions are scoped to
   * a single panel-open lifecycle, mirroring the portal behavior).
   */
  clearSavedSessions(): void {
    this.savedSessions = [];
    this.currentSessionId = makeSessionId();
  }

  private snapshotCurrentIfMeaningful(): void {
    // Only snapshot if the user has actually engaged (sent ≥ 1 message)
    const hasUserTurn = this.state.turns.some((t) => t.role === "user");
    if (!hasUserTurn) return;
    if (!this.currentModeId) return;
    const firstUser = this.state.turns.find((t) => t.role === "user");
    const label = (firstUser?.content ?? "").slice(0, 40) || "Conversation";
    this.savedSessions = [
      ...this.savedSessions,
      {
        id: this.currentSessionId,
        modeId: this.currentModeId,
        savedAt: new Date().toISOString(),
        state: { ...this.state },
        label,
      },
    ];
  }
}

function makeSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
