function ClassifyIssue(input: IssueInput) -> IssueClassification {
  client OpenAINano
  prompt #"
    You are a software issue triage assistant. Given a user conversation and technical metadata, classify the issue.

    Conversation transcript:
    {{ input.transcript | map(attribute="content") | join("\n") }}

    Technical context:
    - URL: {{ input.metadata.url }}
    - User agent: {{ input.metadata.userAgent }}
    - Submitted by: {{ input.tier }} tier user

    {% if input.repo_context and input.repo_context.labels %}
    Available labels in this repo:
    {% for label in input.repo_context.labels %}
    - {{ label.name }}{% if label.description %}: {{ label.description }}{% endif %}
    {% endfor %}
    {% endif %}

    Classify the issue. Choose category from: bug, ux, feature, question, other.
    Choose severity from: critical, high, normal, low.
    Only suggest labels that exist in the repo (listed above) or standard GitHub labels.
    Set requires_reproduction to true only for bugs that need steps to reproduce.

    {{ ctx.output_format }}
  "#
}
