import { resolveUserTier, unauthorized, validateApiKey } from "@/lib/auth";
import { isRateLimited, tooManyRequests } from "@/lib/ratelimit";
import { getServiceSupabase } from "@/lib/supabase";
import type { IssueDraft, SubmissionPayload } from "@consiliency/panel-types";
import { corsPreflight, withCors } from "@/lib/cors";
import { DEFAULT_MODEL_ID, isBetaModelSelectionEnabled } from "@/lib/model-catalog";

export async function OPTIONS(req: Request) { return corsPreflight(req); }

export async function POST(req: Request): Promise<Response> {
  const key = await validateApiKey(req);
  if (!key) return unauthorized();

  if (await isRateLimited(key.productKey)) return tooManyRequests();

  let body: SubmissionPayload;
  try {
    body = (await req.json()) as SubmissionPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // ── Agentic path: the submission row already exists from /next-turn ──────
  if (body.useDraft && body.submissionId) {
    const { data: row } = await supabase
      .from("panel_submissions")
      .select("id, metadata, product_key, tier")
      .eq("id", body.submissionId)
      .single();

    if (!row) {
      return withCors(Response.json({ error: "Submission not found" }, { status: 404 }), req);
    }
    if ((row.product_key as string) !== key.productKey) {
      return withCors(unauthorized(), req);
    }

    const meta = ((row.metadata as Record<string, unknown>) ?? {}) as Record<string, unknown>;
    const draft = meta.draft as IssueDraft | undefined;
    if (!draft) {
      return withCors(
        Response.json({ error: "No draft on submission" }, { status: 400 }),
        req,
      );
    }

    // Pre-submit sanity check (skippable via confirmBypass)
    if (!body.confirmBypass) {
      try {
        const { b } = await import("baml_client");
        const res = await b.IsReadyToSubmit({
          title: draft.title,
          body: draft.body,
          severity: draft.severity,
          kind: draft.kind,
        });
        if (!res.ready) {
          return withCors(
            Response.json(
              {
                error: "Draft not ready",
                reason: res.reason ?? "The draft looks too thin to file.",
                requiresConfirm: true,
              },
              { status: 422 },
            ),
            req,
          );
        }
      } catch (err) {
        console.warn("[submit] IsReadyToSubmit failed, allowing submission:", err);
      }
    }

    await supabase
      .from("panel_submissions")
      .update({
        status: "pending",
        selected_model_id: isBetaModelSelectionEnabled()
          ? body.selectedModelId ?? DEFAULT_MODEL_ID
          : DEFAULT_MODEL_ID,
      })
      .eq("id", body.submissionId);

    return withCors(Response.json({ id: body.submissionId }, { status: 202 }), req);
  }

  // ── Scripted path (legacy): insert a new submission row ─────────────────
  const tier = body.githubLogin
    ? await resolveUserTier(body.githubLogin, key.productKey, key.maxTier)
    : key.maxTier;

  const { data: submission, error } = await supabase
    .from("panel_submissions")
    .insert({
      product_key: key.productKey,
      github_login: body.githubLogin ?? null,
      tier,
      transcript: body.transcript,
      metadata: body.metadata,
      console_errors: body.consoleErrors ?? null,
      console_warnings: (body as any).consoleWarnings ?? null,
      screenshot_url: body.screenshotUrl ?? null,
      status: "pending",
      navigation_breadcrumb: (body as any).navigationBreadcrumb ?? null,
      component_hint: (body as any).componentHint ?? null,
      attachment_urls: (body as any).attachmentUrls ?? null,
      selected_model_id: isBetaModelSelectionEnabled()
        ? body.selectedModelId ?? DEFAULT_MODEL_ID
        : DEFAULT_MODEL_ID,
    })
    .select("id")
    .single();

  if (error || !submission) {
    console.error("Submission insert error:", error);
    return Response.json({ error: "Failed to record submission" }, { status: 500 });
  }

  const submissionId = submission.id as string;
  return withCors(Response.json({ id: submissionId }, { status: 202 }), req);
}
