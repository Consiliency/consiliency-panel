class ConversationTurn {
  role string
  content string
  timestamp string
}

class SubmissionMetadata {
  url string
  title string
  userAgent string
  viewport string
  timestamp string
}

class IssueInput {
  transcript ConversationTurn[]
  metadata SubmissionMetadata
  repo_context RepoContext?
  tier string
}

class RepoContext {
  labels RepoLabel[]?
  recentIssues RepoIssue[]?
  relevantFiles string[]?
}

class RepoLabel {
  name string
  description string?
  color string
}

class RepoIssue {
  number int
  title string
  state string
  url string
}

class IssueLabel {
  name string
  reason string
}

class IssueClassification {
  category string @description("One of: bug, ux, feature, question, other")
  severity string @description("One of: critical, high, normal, low")
  labels IssueLabel[]
  requires_reproduction bool
}

class RepoEnrichment {
  relevant_files string[]
  related_issues string[]
  suggested_assignee string?
  reproduction_steps string[]
}

class IssueOutput {
  plain_summary string @description("2-3 sentences, non-technical, suitable for any user")
  technical_details string @description("Markdown with full technical context, console errors, environment info")
  github_title string @description("Concise issue title under 72 characters")
  github_body string @description("Full GitHub issue body in markdown with template sections")
  labels string[]
  assignee string?
  priority string @description("One of: critical, high, normal, low")
}
