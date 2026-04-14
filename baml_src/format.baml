function FormatAsGitHubIssue(
  input: IssueInput,
  classification: IssueClassification,
  enrichment: RepoEnrichment,
  fix_suggestion: FixSuggestion?
) -> IssueOutput {
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

    {% if input.navigation_breadcrumb %}
    Navigation path:
    {% for entry in input.navigation_breadcrumb %}
    - {{ entry.title }} ({{ entry.url }}) at {{ entry.timestamp }}
    {% endfor %}
    {% endif %}

    {% if input.component_hint %}
    Likely source file: {{ input.component_hint }}
    {% endif %}

    {% if input.console_errors %}
    Console errors captured:
    {% for err in input.console_errors %}
    - {{ err }}
    {% endfor %}
    {% endif %}

    {% if input.console_warnings %}
    Console warnings captured (first 30):
    {% for w in input.console_warnings %}
    - {{ w }}
    {% endfor %}
    {% endif %}

    {% if input.attachment_urls %}
    Attachments:
    {% for att in input.attachment_urls %}
    - {{ att.name }}: {{ att.url }}
    {% endfor %}
    {% endif %}

    {% if fix_suggestion %}
    Fix suggestion (from code analysis):
    - Root cause: {{ fix_suggestion.root_cause }}
    - Approach: {{ fix_suggestion.suggested_approach }}
    {% if fix_suggestion.relevant_functions %}
    - Functions involved: {{ fix_suggestion.relevant_functions | join(", ") }}
    {% endif %}
    {% if fix_suggestion.code_hint %}
    - Code hint:
    ```
    {{ fix_suggestion.code_hint }}
    ```
    {% endif %}
    - Confidence: {{ fix_suggestion.confidence }}
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
       ## Navigation Path (if navigation_breadcrumb provided)
       Table with page title, URL, and timestamp columns.
       ## Component Hint (if component_hint provided)
       Show as: `Likely source file: \`path\``
       ## Console Errors (if console_errors provided)
       Code block with the error list.
       ## Console Warnings (if console_warnings provided)
       Collapsible <details><summary>Console Warnings (N)</summary> block with a code block inside.
       ## Attachments (if attachment_urls provided)
       Bulleted list with markdown image links for screenshots.
       {% if fix_suggestion %}
       ## Suggested Fix
       Include the root cause hypothesis, suggested approach, relevant function names,
       and code hint (if any). End with "_Confidence: {{ fix_suggestion.confidence }}_".
       {% endif %}
    5. labels: Array of label names to apply.
    6. assignee: GitHub login or null.
    7. priority: critical, high, normal, or low.
    8. fix_suggestion: Pass through the fix_suggestion object as-is if provided, otherwise null.

    {{ ctx.output_format }}
  "#
}
