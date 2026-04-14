import { resolveUserTier, unauthorized, validateApiKey } from "@/lib/auth";
import { isRateLimited, tooManyRequests } from "@/lib/ratelimit";
import { getServiceSupabase } from "@/lib/supabase";
import type { SubmissionPayload } from "@consiliency/panel-types";
import { corsPreflight, withCors } from "@/lib/cors";

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

  const tier = body.githubLogin
    ? await resolveUserTier(body.githubLogin, key.productKey, key.maxTier)
    : key.maxTier;

  const supabase = getServiceSupabase();
  const { data: submission, error } = await supabase
    .from("panel_submissions")
    .insert({
      product_key: key.productKey,
      github_login: body.githubLogin ?? null,
      tier,
      transcript: body.transcript,
      metadata: body.metadata,
      console_errors: body.consoleErrors ?? null,
      screenshot_url: body.screenshotUrl ?? null,
      status: "pending",
      navigation_breadcrumb: (body as any).navigationBreadcrumb ?? null,
      component_hint: (body as any).componentHint ?? null,
      attachment_urls: (body as any).attachmentUrls ?? null,
    })
    .select("id")
    .single();

  if (error || !submission) {
    console.error("Submission insert error:", error);
    return Response.json({ error: "Failed to record submission" }, { status: 500 });
  }

  const submissionId = submission.id as string;
  // The browser calls /v1/panel/process/:id directly after this to stream the BAML pipeline.
  return withCors(Response.json({ id: submissionId }, { status: 202 }), req);
}
