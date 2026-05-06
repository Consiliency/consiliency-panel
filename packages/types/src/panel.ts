// Core domain types for @consiliency/panel

export type TrustTier = "guest" | "contractor" | "team";

export type ModeId = "feedback" | "bug-report" | "ai-chat" | "support";

export type ConversationRole = "user" | "assistant";

export type ConversationTurnKind =
  | "scripted"
  | "agent"
  | "user"
  | "clarify"
  | "redirect"
  | "draft"
  | "status";

export interface ConversationTurn {
  role: ConversationRole;
  content: string;
  timestamp: string;
  kind?: ConversationTurnKind;
}

export interface SubmissionMetadata {
  url: string;
  title: string;
  userAgent: string;
  viewport: { width: number; height: number };
  timestamp: string;
  referrer: string;
}

export type PanelPipelineIntakeTarget =
  | "host_app"
  | "panel_widget"
  | "pipeline_intake";

export type PanelPipelineIssueBodySection =
  | "## Summary"
  | "## User-approved details"
  | "## Environment"
  | "## Routing"
  | "## Pipeline intake handoff"
  | "## Linked evidence";

export type PanelPipelineMarkerKey =
  | "panel_source"
  | "panel_submission_id"
  | "panel_product_key"
  | "panel_target"
  | "panel_repo_decision"
  | "panel_intake_candidate"
  | "panel_screenshot_kinds"
  | "panel_summary_ref"
  | "panel_pipeline_hint";

export type PanelPipelineSourceLabel = "source:panel";

export type PanelPipelineTargetLabel =
  | "target:host_app"
  | "target:panel_widget"
  | "target:pipeline_intake";

export type PanelPipelineIntakeCandidateLabel =
  | "pipeline-intake:candidate"
  | "pipeline-intake:deferred";

export interface PanelPipelineIssueLabels {
  source: readonly PanelPipelineSourceLabel[];
  routingTargets: readonly PanelPipelineTargetLabel[];
  intakeCandidates: readonly PanelPipelineIntakeCandidateLabel[];
}

export type PanelPipelineForwardableMetadataKey =
  | "page_url"
  | "page_title"
  | "submission_timestamp"
  | "github_login"
  | "selected_model_id"
  | "component_hint"
  | "screenshot_kinds"
  | "navigation_summary"
  | "context_summary";

export interface PanelPipelineForwardableMetadata {
  page_url: string;
  page_title: string;
  submission_timestamp: string;
  github_login?: string;
  selected_model_id?: string;
  component_hint?: string;
  screenshot_kinds?: Array<NonNullable<AttachmentRef["screenshotKind"]>>;
  navigation_summary?: string;
  context_summary?: string;
}

export interface PanelPipelineLinkedEvidencePolicy {
  transcript: "summarize_or_link";
  console_logs: "summarize_or_link";
  screenshots: "link_only";
  secret_bearing_values: "exclude";
}

export interface PanelPipelineApprovalRequirement {
  explicitUserApprovalRequired: true;
  redactBeforeExternalWrite: true;
  downstreamConsumers: ["github_issue_metadata", "linked_evidence_only"];
}

export interface PanelPipelineIntakeContract {
  source: "panel";
  targets: readonly PanelPipelineIntakeTarget[];
  issueBodySections: readonly PanelPipelineIssueBodySection[];
  labels: PanelPipelineIssueLabels;
  markerKeys: readonly PanelPipelineMarkerKey[];
  forwardableMetadataKeys: readonly PanelPipelineForwardableMetadataKey[];
  linkedEvidencePolicy: PanelPipelineLinkedEvidencePolicy;
  approvalRequirement: PanelPipelineApprovalRequirement;
}

export const PANEL_PIPELINE_INTAKE_TARGETS = [
  "host_app",
  "panel_widget",
  "pipeline_intake",
] as const satisfies readonly PanelPipelineIntakeTarget[];

export const PANEL_PIPELINE_ISSUE_BODY_SECTIONS = [
  "## Summary",
  "## User-approved details",
  "## Environment",
  "## Routing",
  "## Pipeline intake handoff",
  "## Linked evidence",
] as const satisfies readonly PanelPipelineIssueBodySection[];

export const PANEL_PIPELINE_MARKER_KEYS = [
  "panel_source",
  "panel_submission_id",
  "panel_product_key",
  "panel_target",
  "panel_repo_decision",
  "panel_intake_candidate",
  "panel_screenshot_kinds",
  "panel_summary_ref",
  "panel_pipeline_hint",
] as const satisfies readonly PanelPipelineMarkerKey[];

export const PANEL_PIPELINE_FORWARDABLE_METADATA_KEYS = [
  "page_url",
  "page_title",
  "submission_timestamp",
  "github_login",
  "selected_model_id",
  "component_hint",
  "screenshot_kinds",
  "navigation_summary",
  "context_summary",
] as const satisfies readonly PanelPipelineForwardableMetadataKey[];

export const PANEL_PIPELINE_INTAKE_CONTRACT: PanelPipelineIntakeContract = {
  source: "panel",
  targets: PANEL_PIPELINE_INTAKE_TARGETS,
  issueBodySections: PANEL_PIPELINE_ISSUE_BODY_SECTIONS,
  labels: {
    source: ["source:panel"],
    routingTargets: [
      "target:host_app",
      "target:panel_widget",
      "target:pipeline_intake",
    ],
    intakeCandidates: [
      "pipeline-intake:candidate",
      "pipeline-intake:deferred",
    ],
  },
  markerKeys: PANEL_PIPELINE_MARKER_KEYS,
  forwardableMetadataKeys: PANEL_PIPELINE_FORWARDABLE_METADATA_KEYS,
  linkedEvidencePolicy: {
    transcript: "summarize_or_link",
    console_logs: "summarize_or_link",
    screenshots: "link_only",
    secret_bearing_values: "exclude",
  },
  approvalRequirement: {
    explicitUserApprovalRequired: true,
    redactBeforeExternalWrite: true,
    downstreamConsumers: ["github_issue_metadata", "linked_evidence_only"],
  },
};

export interface PanelConfig {
  /** Backend API URL, e.g. https://panel-api.consiliency.io */
  apiUrl: string;
  /** API key for this product installation */
  apiKey: string;
  /** GitHub repo to file issues against, e.g. "Consiliency/consiliency-portal" */
  repo: string;
  /**
   * Optional: the panel's own repo (e.g. "Consiliency/consiliency-panel").
   * When set, a BAML RouteToRepo agent decides at process time whether the
   * feedback is about the host app (→ repo) or the panel widget itself (→ panelRepo).
   */
  panelRepo?: string;
  /** GitHub login of the current user (required for tier resolution) */
  githubLogin?: string;
  /** Optional theme overrides */
  theme?: PanelTheme;
  metadataCollectors?: CustomMetadataCollector[];
  consoleCapture?: boolean;
  navigationTracking?: boolean;
  /**
   * Beta: show a model-selection dropdown in the panel header.
   * Defaults to true during beta; embedders should set false in production
   * (or set backend env PANEL_BETA_MODEL_SELECTION=false).
   */
  betaModelSelection?: boolean;
  /** Beta: initial model ID for the conversation agent */
  defaultModelId?: string;
  /** Beta: optional embedder-side override for the available model list */
  availableModels?: PanelModelOption[];
  /**
   * Async resolver for the GitHub login when the embedder cannot supply
   * `githubLogin` synchronously (e.g. NextAuth session is loading,
   * or login must be derived from an avatar URL). Called once on first
   * SDK init; the resolved value is used for tier resolution headers.
   */
  resolveGithubLogin?: () => Promise<string | undefined>;
}

export interface PanelModelOption {
  id: string;
  label: string;
  provider: string;
}

export interface PanelTheme {
  accent?: string;
  background?: string;
  foreground?: string;
  border?: string;
  radius?: string;
  width?: string;
  buttonBottom?: string;
  buttonRight?: string;
}

export interface PanelUser {
  githubLogin: string;
  tier: TrustTier;
}

export interface CapabilitiesResponse {
  tier: TrustTier;
  modes: ModeId[];
  /** Beta: list of user-selectable models for the conversation agent */
  models?: PanelModelOption[];
  /** Beta: server-side kill switch for model selection */
  betaModelSelection?: boolean;
  /** Beta: backend-recommended default model ID */
  defaultModelId?: string;
}

export interface ModeDefinition {
  id: ModeId;
  label: string;
  description: string;
  comingSoon?: boolean;
  questions: GuidedQuestion[];
  /**
   * Conversation flavor. "scripted" walks the questions array in order;
   * "agentic" emits the first question as an opener and then hands off
   * to the LLM loop via /v1/panel/next-turn.
   */
  mode?: "scripted" | "agentic";
}

export interface GuidedQuestion {
  id: string;
  text: string;
  quickReplies?: string[];
}

export type ConversationPhase =
  | "greeting"
  | "questions"
  | "preview"
  | "submitted"
  | "drafting"
  | "commenting";

export type IssueKind = "bug" | "feature" | "feedback" | "other";
export type IssueSeverity = "blocker" | "high" | "medium" | "low";

export interface IssueDraft {
  title: string;
  body: string;
  severity: IssueSeverity;
  kind: IssueKind;
}

export interface KnownFacts {
  action?: string;
  actual?: string;
  expected?: string;
  severity?: IssueSeverity;
  reproSteps?: string[];
  firstSeen?: string;
  frequency?: string;
  kind?: IssueKind;
}

export type ToolCall =
  | { type: "ask_follow_up"; question: string; reason: string }
  | { type: "clarify_intent"; question: string; options: string[] }
  | { type: "refuse_off_topic"; redirect: string }
  | { type: "draft_issue"; draft: IssueDraft }
  | { type: "revise_draft"; draft: IssueDraft };

export interface ConversationState {
  turns: ConversationTurn[];
  phase: ConversationPhase;
  questionIndex: number;
  screenshotUrl?: string;
  attachmentUrls?: AttachmentRef[];
  mode?: "scripted" | "agentic";
  draft?: IssueDraft;
  selectedModelId?: string;
  knownFacts?: KnownFacts;
  clarifyOptions?: string[];
  submissionId?: string;
  issueUrl?: string;
  issueNumber?: number;
}

export interface SavedSession {
  id: string;
  modeId: ModeId;
  savedAt: string;
  state: ConversationState;
  /** Short label for UI rendering — derived from first user turn */
  label: string;
}

export interface IssuePreview {
  plainSummary: string;
  technicalDetails: string;
  screenshotUrl?: string;
  attachmentUrls?: AttachmentRef[];
}

export interface NavigationEntry {
  url: string;
  title: string;
  ts: string;
}

export interface AttachmentRef {
  url: string;
  type: "screenshot" | "file";
  name: string;
  /** When type=screenshot: distinguishes a host-page capture from a panel-widget capture */
  screenshotKind?: "page" | "panel";
}

export interface CustomMetadataCollector {
  key: string;
  label: string;
  collect: () => unknown;
}

export interface SubmissionPayload {
  productKey?: string; // derived server-side from the API key; optional on client
  githubLogin?: string;
  repo: string;
  transcript: ConversationTurn[];
  metadata: SubmissionMetadata;
  consoleErrors?: string[];
  consoleWarnings?: string[];
  screenshotUrl?: string;
  attachmentUrls?: AttachmentRef[];
  navigationBreadcrumb?: NavigationEntry[];
  componentHint?: string;
  /** Agentic flow: submission row exists; apply stored draft and process it */
  submissionId?: string;
  useDraft?: boolean;
  /** Agentic flow: overrides a prior 422 from IsReadyToSubmit */
  confirmBypass?: boolean;
  /** Agentic flow: which model the user selected for the intake */
  selectedModelId?: string;
}

export interface NextTurnRequest {
  submissionId?: string;
  userText: string;
  selectedModelId?: string;
  repo: string;
  panelRepo?: string;
  metadata: SubmissionMetadata;
  transcript: ConversationTurn[];
  screenshotUrl?: string;
  attachmentUrls?: AttachmentRef[];
  navigationBreadcrumb?: NavigationEntry[];
  componentHint?: string;
  githubLogin?: string;
}

export interface NextTurnResponse {
  submissionId: string | null;
  toolCall: ToolCall;
  knownFacts: KnownFacts;
}

export interface CommentDraftState {
  draftId: string;
  issueNumber: number;
  issueUrl: string;
  issueBody: string;
  transcript: ConversationTurn[];
  draftBody?: string;
  status: "drafting" | "approved" | "posted";
}

export interface PreSubmitRejection {
  reason: string;
  requiresConfirm: true;
}

export interface ProcessEvent {
  type: "progress" | "completed" | "routing" | "error";
  message?: string;
  issueUrl?: string;
  issueNumber?: number;
  title?: string;
  plainSummary?: string;
  /** Emitted on routing events: which repo was chosen and why */
  target?: "app" | "panel";
  targetRepo?: string;
  confidence?: string;
}

export interface RepoContext {
  tier: TrustTier;
  labels?: RepoLabel[];
  recentIssues?: RepoIssue[];
  relevantFiles?: string[];
  recentCommits?: string[];
}

export interface RepoLabel {
  name: string;
  description?: string;
  color: string;
}

export interface RepoIssue {
  number: number;
  title: string;
  state: string;
  url: string;
}

export interface PanelApiClientConfig {
  apiUrl: string;
  apiKey: string;
}
