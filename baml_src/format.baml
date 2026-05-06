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
    2. technical_details: Short markdown summary with environment, file references, and bounded console context for persistence. Do not dump the full transcript, raw console logs, or screenshot payloads.
    3. github_title: Under 72 characters. Starts with category prefix if bug/feature.
    4. issue_sections: Return exactly these fixed sections and only the body text for each section:
       - summary -> `## Summary`
       - user_approved_details -> `## User-approved details`
       - environment -> `## Environment`
       - routing -> `## Routing`
       - pipeline_intake_handoff -> `## Pipeline intake handoff`
       - linked_evidence -> `## Linked evidence`
       Rules:
       - `user_approved_details` must contain only details the user explicitly approved for external write.
       - `pipeline_intake_handoff` must contain bounded metadata and marker references only, never raw transcript dumps, raw console log blocks, or raw screenshot payloads.
       - `linked_evidence` may summarize or link transcript, console, and screenshot evidence, but must not inline secret-bearing values.
       - If reproduction steps are useful, weave them into `user_approved_details` instead of creating new sections.
       - If navigation, component hint, console context, attachments, or fix suggestion are relevant, place them in the fixed sections above without inventing extra headings.
    5. labels: Array of label names to apply. Include the frozen routing/intake labels when justified and any additional bounded repo labels that should be applied verbatim.
    6. issue_markers: Provide exact string values for the frozen marker keys:
       - panel_source
       - panel_submission_id
       - panel_product_key
       - panel_target
       - panel_repo_decision
       - panel_intake_candidate
       - panel_screenshot_kinds
       - panel_summary_ref
       - panel_pipeline_hint
       Use concise bounded values only. `panel_source` must be `panel`.
    7. pipeline_handoff:
       - status: `candidate` when this should enter governed development intake, otherwise `deferred`
       - pipeline_hint: short bounded explanation of that decision
       - forwardable_metadata_summary: short summary of the structured metadata safe to forward downstream
    8. assignee: GitHub login or null.
    9. priority: critical, high, normal, or low.
    10. fix_suggestion: Pass through the fix_suggestion object as-is if provided, otherwise null.

    {{ ctx.output_format }}
  "#
}
