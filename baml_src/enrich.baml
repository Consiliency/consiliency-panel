function EnrichWithRepoContext(input: IssueInput, classification: IssueClassification) -> RepoEnrichment {
  client Gemma3
  prompt #"
    You are a software engineering assistant helping enrich a bug report with repository context.

    Issue classification:
    - Category: {{ classification.category }}
    - Severity: {{ classification.severity }}
    - Requires reproduction: {{ classification.requires_reproduction }}

    User conversation:
    {{ input.transcript | map(attribute="content") | join("\n") }}

    {% if input.repo_context %}
    Repository context available ({{ input.tier }} tier):
    {% if input.repo_context.relevantFiles %}
    Known files:
    {% for f in input.repo_context.relevantFiles %}
    - {{ f }}
    {% endfor %}
    {% endif %}

    {% if input.repo_context.recentIssues %}
    Recent open issues (check for duplicates):
    {% for issue in input.repo_context.recentIssues %}
    - #{{ issue.number }}: {{ issue.title }} ({{ issue.state }})
    {% endfor %}
    {% endif %}
    {% else %}
    No repository context available for this tier.
    {% endif %}

    Based on the conversation and any available context:
    1. Identify relevant source files (empty list if no context available)
    2. Identify potentially related or duplicate issues (empty list if none found)
    3. Suggest an assignee if you can identify one from context (null otherwise)
    4. List concrete reproduction steps if this is a bug (empty list otherwise)

    {{ ctx.output_format }}
  "#
}
