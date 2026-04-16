import { validateApiKey, unauthorized } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { getGitHubClient } from "@/lib/github";
import { corsPreflight, withCors } from "@/lib/cors";
import { isRateLimited, tooManyRequests } from "@/lib/ratelimit";

export async function OPTIONS(req: Request) { return corsPreflight(req); }

export async function POST(req: Request): Promise<Response> {
  const key = await validateApiKey(req);
  if (!key) return withCors(unauthorized(), req);

  if (await isRateLimited(key.productKey)) return withCors(tooManyRequests(), req);

  const { submissionId, body: commentBody } = (await req.json()) as {
    submissionId: string;
    body: string;
  };

  if (!submissionId || !commentBody?.trim()) {
    return withCors(
      Response.json({ error: "submissionId and body are required" }, { status: 400 }),
      req,
    );
  }

  const supabase = getServiceSupabase();

  const { data: submission } = await supabase
    .from("panel_submissions")
    .select("tier")
    .eq("id", submissionId)
    .single();

  if (!submission) {
    return withCors(Response.json({ error: "Submission not found" }, { status: 404 }), req);
  }

  const { data: issue } = await supabase
    .from("panel_issues")
    .select("github_issue_url, github_issue_number")
    .eq("submission_id", submissionId)
    .single();

  if (!issue) {
    return withCors(
      Response.json({ error: "Issue not found for this submission" }, { status: 404 }),
      req,
    );
  }

  // Parse owner/repo from the full GitHub issue URL
  const urlMatch = (issue.github_issue_url as string).match(
    /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/,
  );
  if (!urlMatch) {
    return withCors(Response.json({ error: "Invalid issue URL" }, { status: 400 }), req);
  }
  const [, owner, repo] = urlMatch;

  const octokit = getGitHubClient(submission.tier as "guest" | "contractor" | "team");

  try {
    const { data: comment } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issue.github_issue_number as number,
      body: commentBody.trim(),
    });
    return withCors(Response.json({ commentUrl: comment.html_url }, { status: 201 }), req);
  } catch (err) {
    console.error("Comment creation error:", err);
    return withCors(
      Response.json({ error: "Failed to post comment to GitHub" }, { status: 502 }),
      req,
    );
  }
}
