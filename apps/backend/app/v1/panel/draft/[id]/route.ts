import { unauthorized, validateApiKey } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { corsPreflight, withCors } from "@/lib/cors";
import type { IssueDraft, IssueKind, IssueSeverity } from "@consiliency/panel-types";

export async function OPTIONS(req: Request) { return corsPreflight(req); }

function validDraft(d: unknown): d is IssueDraft {
  if (!d || typeof d !== "object") return false;
  const x = d as Record<string, unknown>;
  const sevOk =
    x.severity === "blocker" ||
    x.severity === "high" ||
    x.severity === "medium" ||
    x.severity === "low";
  const kindOk =
    x.kind === "bug" || x.kind === "feature" || x.kind === "feedback" || x.kind === "other";
  return (
    typeof x.title === "string" &&
    typeof x.body === "string" &&
    sevOk &&
    kindOk
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const key = await validateApiKey(req);
  if (!key) return withCors(unauthorized(), req);

  const { id } = await params;

  let body: { draft: IssueDraft };
  try {
    body = (await req.json()) as { draft: IssueDraft };
  } catch {
    return withCors(Response.json({ error: "Invalid JSON body" }, { status: 400 }), req);
  }

  if (!validDraft(body.draft)) {
    return withCors(Response.json({ error: "Invalid draft shape" }, { status: 400 }), req);
  }

  const supabase = getServiceSupabase();
  const { data: row } = await supabase
    .from("panel_submissions")
    .select("metadata, product_key")
    .eq("id", id)
    .single();

  if (!row) {
    return withCors(Response.json({ error: "Submission not found" }, { status: 404 }), req);
  }
  if ((row.product_key as string) !== key.productKey) {
    return withCors(unauthorized(), req);
  }

  const draft = body.draft as IssueDraft & { severity: IssueSeverity; kind: IssueKind };
  const meta = ((row.metadata as Record<string, unknown>) ?? {}) as Record<string, unknown>;

  await supabase
    .from("panel_submissions")
    .update({
      metadata: { ...meta, draft },
      kind: draft.kind,
    })
    .eq("id", id);

  return withCors(Response.json({ ok: true }), req);
}
