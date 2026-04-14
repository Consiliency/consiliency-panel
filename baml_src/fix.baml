function SuggestFix(
  input: IssueInput,
  classification: IssueClassification,
  enrichment: RepoEnrichment
) -> FixSuggestion {
  client ClaudeSonnet
  prompt #"
    You are a senior software engineer reviewing a bug or UX issue reported by a user.
    Your job is to read the source code and produce a concrete, actionable fix suggestion.

    Issue category: {{ classification.category }}
    Severity: {{ classification.severity }}

    User report (conversation transcript):
    {% for turn in input.transcript %}
    {{ turn.role }}: {{ turn.content }}
    {% endfor %}

    Affected page: {{ input.metadata.url }}

    {% if input.repo_context and input.repo_context.file_contents %}
    Relevant source files:
    {% for filename in enrichment.relevant_files %}
    {% if filename in input.repo_context.file_contents %}

    ### {{ filename }}
    ```
    {{ input.repo_context.file_contents[filename] }}
    ```
    {% endif %}
    {% endfor %}
    {% else %}
    No source file contents available.
    {% endif %}

    Based on the user's report and the source code above:
    1. List the specific function or method names most likely involved (empty list if unknown).
    2. State a root cause hypothesis — what is wrong or missing and why.
    3. Describe in plain English how you would fix it (no jargon beyond what the code already uses).
    4. Optionally provide a short illustrative code snippet (under 20 lines) showing the key change.
       Only include this if you can write something genuinely useful — omit if speculative.
    5. Rate your confidence: "high" if the source code clearly shows the problem,
       "medium" if you can make a reasonable inference, "low" if mostly speculative.

    {{ ctx.output_format }}
  "#
}
