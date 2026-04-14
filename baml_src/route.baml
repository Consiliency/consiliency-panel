class RoutingDecision {
  target string  @description("'app' or 'panel'")
  reasoning string
  confidence string  @description("One of: high, medium, low")
}

function RouteToRepo(
  transcript: ConversationTurn[],
  metadata: SubmissionMetadata,
  retained_screenshot_kinds: string[],
) -> RoutingDecision {
  client OpenAINano
  prompt #"
    You are a triage router for a software feedback panel embedded in a web application.

    Determine whether this feedback is about:
    - "panel" — the feedback/chat widget itself (its UI, screenshot capture, the submission flow, or the widget's own features)
    - "app"   — the underlying application page the user was viewing when they opened the panel

    Decision clues (in priority order):
    1. Retained screenshots: {{ retained_screenshot_kinds | join(", ") }}
       - Only "panel" retained → strong signal the issue is about the panel widget
       - Only "page" retained  → strong signal the issue is about the app
       - Both or neither       → rely on transcript content
    2. Transcript: does the user describe something in the chat UI, or in the page behind it?
    3. Page URL/title: if the URL is clearly a client application (not the panel SDK docs), lean toward "app"

    Transcript:
    {% for t in transcript %}
    {{ t.role }}: {{ t.content }}
    {% endfor %}

    Page: {{ metadata.url }}
    Title: {{ metadata.title }}

    {{ ctx.output_format }}
  "#
}
