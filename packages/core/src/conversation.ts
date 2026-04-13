import type {
  ConversationState,
  ConversationTurn,
  IssuePreview,
  ModeId,
  SubmissionMetadata,
} from "@consiliency/panel-types";
import { ModeRegistry } from "./modes";

export class ConversationEngine {
  private registry: ModeRegistry;
  private metadata: SubmissionMetadata | null = null;

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

  setScreenshotUrl(url: string): void {
    this.state = { ...this.state, screenshotUrl: url };
  }

  addAttachmentUrl(url: string): void {
    this.state = {
      ...this.state,
      attachmentUrls: [...(this.state.attachmentUrls ?? []), url],
    };
  }

  async start(modeId: ModeId): Promise<ConversationTurn> {
    const mode = this.registry.get(modeId);
    const greeting: ConversationTurn = {
      role: "assistant",
      content: `I'll help you submit feedback. ${mode.questions[0]?.text ?? "What would you like to report?"}`,
      timestamp: new Date().toISOString(),
    };
    this.state = {
      turns: [greeting],
      phase: "questions",
      questionIndex: 0,
    };
    return greeting;
  }

  async respond(modeId: ModeId, userText: string): Promise<ConversationTurn> {
    const userTurn: ConversationTurn = {
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
    };

    const mode = this.registry.get(modeId);
    const nextIndex = this.state.questionIndex + 1;

    this.state = {
      ...this.state,
      turns: [...this.state.turns, userTurn],
    };

    if (nextIndex < mode.questions.length) {
      const nextQuestion = mode.questions[nextIndex];
      const assistantTurn: ConversationTurn = {
        role: "assistant",
        content: nextQuestion.text,
        timestamp: new Date().toISOString(),
      };
      this.state = {
        ...this.state,
        turns: [...this.state.turns, assistantTurn],
        questionIndex: nextIndex,
      };
      return assistantTurn;
    }

    // All questions answered — move to preview phase
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

  markSubmitted(): void {
    this.state = { ...this.state, phase: "submitted" };
  }

  reset(): void {
    this.state = {
      turns: [],
      phase: "greeting",
      questionIndex: 0,
    };
  }
}
