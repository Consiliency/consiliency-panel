import { resolveUserTier, unauthorized, validateApiKey } from "@/lib/auth";
import { isRateLimited, tooManyRequests } from "@/lib/ratelimit";
import { getServiceSupabase } from "@/lib/supabase";
import type { SubmissionPayload } from "@consiliency/panel-types";
import { after } from "next/server";
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
    })
    .select("id")
    .single();

  if (error || !submission) {
    console.error("Submission insert error:", error);
    return Response.json({ error: "Failed to record submission" }, { status: 500 });
  }

  const submissionId = submission.id as string;

  // Kick off BAML pipeline after response is sent (avoids 30s timeout on synchronous path)
  after(async () => {
    try {
      const processUrl = `${process.env.NEXT_PUBLIC_PANEL_API_URL}/v1/panel/process/${submissionId}`;
      await fetch(processUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PANEL_INTERNAL_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo: body.repo }),
      });
    } catch (err) {
      console.error("Failed to kick off process job:", err);
    }
  });

  return withCors(Response.json({ id: submissionId }, { status: 202 }), req);
}
