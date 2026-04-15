class IssueDraftIn {
  title string
  body string
  severity string
  kind string
}

class PreSubmitResult {
  ready bool @description("true if the draft has enough substance to file as a real GitHub issue")
  reason string? @description("If ready is false, a short human-readable reason to show the user")
}

function IsReadyToSubmit(draft: IssueDraftIn) -> PreSubmitResult {
  client OpenAINano
  prompt #"
    Decide whether this draft issue is substantive enough to file on GitHub.

    TITLE: {{ draft.title }}
    BODY:
    {{ draft.body }}
    SEVERITY: {{ draft.severity }}
    KIND: {{ draft.kind }}

    Set ready=false only for drafts that are:
    - Empty or near-empty (e.g., "test", "asdf", a single word)
    - Obviously junk or filler ("this is a test", "ignore me")
    - Missing any description of what the problem/request actually is

    Any draft with a real problem statement — even a short one — is ready=true.

    If ready=false, set reason to ONE SHORT sentence the user will see (e.g.,
    "This looks like a test — the body doesn't describe what's wrong.").

    {{ ctx.output_format }}
  "#
}
