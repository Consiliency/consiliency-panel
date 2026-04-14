class ConversationTurn {
  role string
  content string
  timestamp string?
}

class SubmissionMetadata {
  url string
  title string
  userAgent string
  viewport string
  timestamp string
}

class NavigationEntry {
  url string
  title string
  timestamp string
}

class AttachmentRef {
  url string
  type string  @description("screenshot or file")
  name string
}

class IssueInput {
  transcript ConversationTurn[]
  metadata SubmissionMetadata
  repo_context RepoContext?
  tier string
  console_errors string[]?
  navigation_breadcrumb NavigationEntry[]?
  component_hint string?
  attachment_urls AttachmentRef[]?
}

class RepoContext {
  labels RepoLabel[]?
  recentIssues RepoIssue[]?
  relevantFiles string[]?
  file_contents map<string, string>? @description("Filename → truncated file content, team tier only")
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

class FixSuggestion {
  relevant_functions string[] @description("Specific function or method names to inspect")
  root_cause string           @description("Hypothesis about why this is failing or what is missing")
  suggested_approach string   @description("Plain-English description of how to fix it")
  code_hint string?           @description("Optional short code snippet (< 20 lines) illustrating the fix")
  confidence string           @description("One of: high, medium, low")
}

class IssueOutput {
  plain_summary string @description("2-3 sentences, non-technical, suitable for any user")
  technical_details string @description("Markdown with full technical context, console errors, environment info")
  github_title string @description("Concise issue title under 72 characters")
  github_body string @description("Full GitHub issue body in markdown with template sections")
  labels string[]
  assignee string?
  priority string @description("One of: critical, high, normal, low")
  fix_suggestion FixSuggestion? @description("Present only for team tier when file contents were available")
}
