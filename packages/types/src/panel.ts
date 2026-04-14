// Core domain types for @consiliency/panel

export type TrustTier = "guest" | "contractor" | "team";

export type ModeId = "feedback" | "bug-report" | "ai-chat" | "support";

export type ConversationRole = "user" | "assistant";

export interface ConversationTurn {
  role: ConversationRole;
  content: string;
  timestamp: string;
}

export interface SubmissionMetadata {
  url: string;
  title: string;
  userAgent: string;
  viewport: { width: number; height: number };
  timestamp: string;
  referrer: string;
}

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
}

export interface ModeDefinition {
  id: ModeId;
  label: string;
  description: string;
  comingSoon?: boolean;
  questions: GuidedQuestion[];
}

export interface GuidedQuestion {
  id: string;
  text: string;
  quickReplies?: string[];
}

export type ConversationPhase = "greeting" | "questions" | "preview" | "submitted";

export interface ConversationState {
  turns: ConversationTurn[];
  phase: ConversationPhase;
  questionIndex: number;
  screenshotUrl?: string;
  attachmentUrls?: AttachmentRef[];
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
}

export interface ProcessEvent {
  type: "progress" | "completed" | "routing" | "error";
  message?: string;
  issueUrl?: string;
  issueNumber?: number;
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
