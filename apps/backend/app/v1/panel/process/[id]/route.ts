import { getServiceSupabase } from "@/lib/supabase";
import { getGitHubClient, parseRepo } from "@/lib/github";
import type { PanelSubmission } from "@consiliency/panel-types";

// Internal-only route — called by after() in submit/route.ts
// Protected by PANEL_INTERNAL_SECRET, not the public API key
function validateInternalSecret(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.PANEL_INTERNAL_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  if (!validateInternalSecret(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as { repo: string };

  const supabase = getServiceSupabase();

  // Mark as processing
  await supabase
    .from("panel_submissions")
    .update({ status: "processing" })
    .eq("id", id);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        // Fetch the submission
        const { data: submission } = await supabase
          .from("panel_submissions")
          .select("*")
          .eq("id", id)
          .single();

        if (!submission) {
          send({ type: "error", message: "Submission not found" });
          controller.close();
          return;
        }

        const sub = submission as PanelSubmission;

        // Fetch repo context for enrichment
        send({ type: "progress", message: "Gathering repository context…" });

        const { owner, repo } = parseRepo(body.repo);
        const octokit = getGitHubClient(sub.tier as "guest" | "contractor" | "team");

        const [{ data: labels }, { data: issues }] = await Promise.all([
          octokit.issues.listLabelsForRepo({ owner, repo, per_page: 50 }),
          octokit.issues.listForRepo({ owner, repo, state: "open", per_page: 20 }),
        ]);

        const repoContext = {
          labels: labels.map((l) => ({ name: l.name, description: l.description ?? undefined, color: l.color })),
          recentIssues: issues.map((i) => ({ number: i.number, title: i.title, state: i.state, url: i.html_url })),
        };

        // Dynamically import BAML client (generated — may not exist yet during scaffold)
        send({ type: "progress", message: "Classifying issue…" });

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { b } = require("../../../../../../baml_client") as {
          b: {
            ClassifyIssue: (input: unknown) => Promise<unknown>;
            EnrichWithRepoContext: (input: unknown, cls: unknown) => Promise<unknown>;
            FormatAsGitHubIssue: (input: unknown, cls: unknown, enrich: unknown) => Promise<unknown>;
          };
        };

        const issueInput = {
          transcript: sub.transcript,
          metadata: sub.metadata,
          repo_context: repoContext,
          tier: sub.tier,
        };

        const classification = await b.ClassifyIssue(issueInput);

        send({ type: "progress", message: "Enriching with context…" });
        const enrichment = await b.EnrichWithRepoContext(issueInput, classification);

        send({ type: "progress", message: "Formatting issue…" });
        const issueOutput = await b.FormatAsGitHubIssue(issueInput, classification, enrichment) as {
          github_title: string;
          github_body: string;
          labels: string[];
          assignee?: string;
          plain_summary: string;
          technical_details: string;
          priority: string;
        };

        // Create GitHub issue
        send({ type: "progress", message: "Creating GitHub issue…" });
        const { data: createdIssue } = await octokit.issues.create({
          owner,
          repo,
          title: issueOutput.github_title,
          body: issueOutput.github_body,
          labels: issueOutput.labels,
          assignees: issueOutput.assignee ? [issueOutput.assignee] : undefined,
        });

        // Persist result
        await supabase.from("panel_issues").insert({
          submission_id: id,
          github_issue_number: createdIssue.number,
          github_issue_url: createdIssue.html_url,
          plain_summary: issueOutput.plain_summary,
          technical_details: { raw: issueOutput.technical_details, priority: issueOutput.priority },
          labels: issueOutput.labels,
        });

        await supabase
          .from("panel_submissions")
          .update({ status: "completed" })
          .eq("id", id);

        send({
          type: "complete",
          message: "Issue created successfully",
          issueUrl: createdIssue.html_url,
          issueNumber: createdIssue.number,
        });
      } catch (err) {
        console.error("Process pipeline error:", err);
        await supabase
          .from("panel_submissions")
          .update({ status: "failed" })
          .eq("id", id);
        send({ type: "error", message: err instanceof Error ? err.message : "Pipeline failed" });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
