function FormatAsGitHubIssue(input: IssueInput, classification: IssueClassification, enrichment: RepoEnrichment) -> IssueOutput {
  client KimiK2
  prompt #"
    You are a technical writer creating a well-structured GitHub issue from a user conversation.

    User conversation:
    {{ input.transcript | map(attribute="content") | join("\n") }}

    Technical metadata:
    - URL: {{ input.metadata.url }}
    - Title: {{ input.metadata.title }}
    - Timestamp: {{ input.metadata.timestamp }}
    - User agent: {{ input.metadata.userAgent }}

    Classification:
    - Category: {{ classification.category }}
    - Severity: {{ classification.severity }}
    - Labels: {{ classification.labels | map(attribute="name") | join(", ") }}

    Enrichment:
    {% if enrichment.relevant_files %}
    - Relevant files: {{ enrichment.relevant_files | join(", ") }}
    {% endif %}
    {% if enrichment.reproduction_steps %}
    - Reproduction steps: {{ enrichment.reproduction_steps | join("; ") }}
    {% endif %}
    {% if enrichment.related_issues %}
    - Related issues: {{ enrichment.related_issues | join(", ") }}
    {% endif %}

    Create:
    1. plain_summary: 2-3 non-technical sentences suitable for any user. No jargon.
    2. technical_details: Markdown with environment, console context, and file references.
    3. github_title: Under 72 characters. Starts with category prefix if bug/feature.
    4. github_body: Full issue body with these sections:
       ## Description
       ## Steps to Reproduce (if applicable)
       ## Expected Behavior
       ## Actual Behavior (if applicable)
       ## Environment
       ## Additional Context
    5. labels: Array of label names to apply.
    6. assignee: GitHub login or null.
    7. priority: critical, high, normal, or low.

    {{ ctx.output_format }}
  "#
}
