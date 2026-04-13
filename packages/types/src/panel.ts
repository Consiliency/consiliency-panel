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
  /** GitHub login of the current user (required for tier resolution) */
  githubLogin?: string;
  /** Optional theme overrides */
  theme?: PanelTheme;
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
  attachmentUrls?: string[];
}

export interface IssuePreview {
  plainSummary: string;
  technicalDetails: string;
  screenshotUrl?: string;
  attachmentUrls?: string[];
}

export interface SubmissionPayload {
  productKey?: string; // derived server-side from the API key; optional on client
  githubLogin?: string;
  repo: string;
  transcript: ConversationTurn[];
  metadata: SubmissionMetadata;
  consoleErrors?: string[];
  screenshotUrl?: string;
  attachmentUrls?: string[];
}

export interface ProcessEvent {
  type: "progress" | "complete" | "error";
  message: string;
  issueUrl?: string;
  issueNumber?: number;
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
