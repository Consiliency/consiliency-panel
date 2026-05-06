import { validateApiKey, unauthorized } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { getGitHubClient, parseRepo } from "@/lib/github";
import { corsPreflight, withCors } from "@/lib/cors";
import { BamlValidationError } from "@boundaryml/baml";
import {
  PANEL_PIPELINE_ISSUE_BODY_SECTIONS,
  type ConversationTurn,
  type PanelIssueMarkerMap,
  type PanelIssueSections,
  type PanelIssueTechnicalDetails,
  type PanelPipelineForwardableMetadata,
  type PanelPipelineHandoff,
  type PanelRepoDecision,
  type PanelRepoRoutingTarget,
  type PanelSubmission,
  type SubmissionMetadata,
} from "@consiliency/panel-types";

export async function OPTIONS(req: Request) { return corsPreflight(req); }

const MAX_TURN_CONTENT_LENGTH = 4000;

/**
 * Sanitize user-supplied transcript content before passing to BAML.
 * Prevents prompt injection via oversized or control-character-laden strings.
 */
function sanitizeTranscript(turns: ConversationTurn[]): ConversationTurn[] {
  return turns.map((turn) => ({
    ...turn,
    content: turn.content
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip non-printable control chars
      .slice(0, MAX_TURN_CONTENT_LENGTH),
  }));
}

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function renderIssueBody(
  sections: PanelIssueSections,
  markers: PanelIssueMarkerMap,
): string {
  const bodies: Record<(typeof PANEL_PIPELINE_ISSUE_BODY_SECTIONS)[number], string> = {
    "## Summary": sections.summary,
    "## User-approved details": sections.user_approved_details,
    "## Environment": sections.environment,
    "## Routing": sections.routing,
    "## Pipeline intake handoff": [
      sections.pipeline_intake_handoff.trim(),
      renderTrackingMarkers(markers),
    ]
      .filter(Boolean)
      .join("\n\n"),
    "## Linked evidence": sections.linked_evidence,
  };

  return PANEL_PIPELINE_ISSUE_BODY_SECTIONS.map((heading) => {
    const body = bodies[heading]?.trim() || "_None provided._";
    return `${heading}\n${body}`;
  }).join("\n\n");
}

function renderTrackingMarkers(markers: PanelIssueMarkerMap): string {
  const entries = Object.entries(markers).filter((entry): entry is [string, string] => {
    const [, value] = entry;
    return typeof value === "string" && value.trim().length > 0;
  });
  if (entries.length === 0) return "";
  return [
    "Tracking markers:",
    ...entries.map(([key, value]) => `- \`${key}\`: ${value}`),
  ].join("\n");
}

function summarizeNavigation(
  navigation: Array<{ url: string; title: string; ts: string }> | null,
): string | undefined {
  if (!navigation?.length) return undefined;
  return navigation
    .slice(0, 5)
    .map((entry) => `${entry.title} (${entry.url})`)
    .join(" -> ");
}

function getScreenshotKinds(
  attachments: Array<{ url: string; type: string; name: string }> | null,
): Array<"page" | "panel"> {
  return (attachments ?? [])
    .filter((attachment) => attachment.type === "screenshot")
    .map((attachment) => {
      if (attachment.name.startsWith("screenshot-page")) return "page" as const;
      if (attachment.name.startsWith("screenshot-panel")) return "panel" as const;
      return null;
    })
    .filter((kind): kind is "page" | "panel" => kind !== null);
}

function toRoutingTarget(repoDecision: PanelRepoDecision): PanelRepoRoutingTarget {
  return repoDecision === "panel" ? "panel_widget" : "host_app";
}

function buildForwardableMetadata(args: {
  metadata: SubmissionMetadata;
  githubLogin: string | null;
  selectedModelId: string | null;
  componentHint: string | null;
  screenshotKinds: Array<"page" | "panel">;
  navigationBreadcrumb: Array<{ url: string; title: string; ts: string }> | null;
  contextSummary: string;
}): PanelPipelineForwardableMetadata {
  const {
    metadata,
    githubLogin,
    selectedModelId,
    componentHint,
    screenshotKinds,
    navigationBreadcrumb,
    contextSummary,
  } = args;

  return {
    page_url: metadata.url,
    page_title: metadata.title,
    submission_timestamp: metadata.timestamp,
    github_login: githubLogin ?? undefined,
    selected_model_id: selectedModelId ?? undefined,
    component_hint: componentHint ?? undefined,
    screenshot_kinds: screenshotKinds.length > 0 ? screenshotKinds : undefined,
    navigation_summary: summarizeNavigation(navigationBreadcrumb),
    context_summary: contextSummary || undefined,
  };
}

function buildIssueLabels(args: {
  formatterLabels: string[];
  routingTarget: PanelRepoRoutingTarget;
  handoffStatus: PanelPipelineHandoff["status"];
}): string[] {
  const required = [
    "source:panel",
    args.routingTarget === "panel_widget"
      ? "target:panel_widget"
      : "target:host_app",
    `pipeline-intake:${args.handoffStatus}`,
  ];

  if (args.handoffStatus === "candidate") {
    required.push("target:pipeline_intake");
  }

  return Array.from(new Set([...args.formatterLabels, ...required]));
}

function buildIssueMarkers(args: {
  submissionId: string;
  productKey: string;
  routingTarget: PanelRepoRoutingTarget;
  repoDecision: PanelRepoDecision;
  handoffStatus: PanelPipelineHandoff["status"];
  screenshotKinds: Array<"page" | "panel">;
  plainSummary: string;
  pipelineHint: string;
  formatterMarkers: Record<string, string>;
}): PanelIssueMarkerMap {
  return {
    ...args.formatterMarkers,
    panel_source: "panel",
    panel_submission_id: args.submissionId,
    panel_product_key: args.productKey,
    panel_target: args.routingTarget,
    panel_repo_decision: args.repoDecision,
    panel_intake_candidate: args.handoffStatus,
    panel_screenshot_kinds: args.screenshotKinds.length > 0 ? args.screenshotKinds.join(",") : "none",
    panel_summary_ref: args.formatterMarkers.panel_summary_ref || args.plainSummary,
    panel_pipeline_hint: args.pipelineHint,
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const key = await validateApiKey(req);
  if (!key) return withCors(unauthorized(), req);

  const { id } = await params;
  const body = (await req.json()) as { repo: string; panelRepo?: string };

  const supabase = getServiceSupabase();

  // Atomically transition pending/failed → processing (idempotency guard)
  const { data: updated } = await supabase
    .from("panel_submissions")
    .update({ status: "processing" })
    .eq("id", id)
    .in("status", ["pending", "failed"])
    .select("id")
    .maybeSingle();

  if (!updated) {
    // Already processing or completed — check which
    const { data: existing } = await supabase
      .from("panel_submissions")
      .select("status")
      .eq("id", id)
      .single();

    if (existing?.status === "completed") {
      // Return the existing issue as an SSE completed event
      const { data: existingIssue } = await supabase
        .from("panel_issues")
        .select("github_issue_url, github_issue_number, plain_summary, technical_details")
        .eq("submission_id", id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (existingIssue) {
        const storedDetails = existingIssue.technical_details as PanelIssueTechnicalDetails | null;
        const enc = new TextEncoder();
        const replayStream = new ReadableStream({
          start(ctrl) {
            if (storedDetails?.pipelineHandoff?.status === "candidate") {
              ctrl.enqueue(enc.encode(sseEvent({
                type: "pipeline_handoff",
                message: "Replaying stored pipeline handoff",
                target: storedDetails.pipelineHandoff.repoDecision,
                routingTarget: storedDetails.pipelineHandoff.routingTarget,
                targetRepo: storedDetails.pipelineHandoff.targetRepo,
                handoffStatus: storedDetails.pipelineHandoff.status,
                issueLabels: storedDetails.pipelineHandoff.issueLabels,
                trackingMarkers: storedDetails.pipelineHandoff.trackingMarkers,
                forwardableMetadata: storedDetails.pipelineHandoff.forwardableMetadata,
                pipelineHint: storedDetails.pipelineHandoff.pipelineHint,
              })));
            }
            ctrl.enqueue(enc.encode(sseEvent({
              type: "completed",
              message: "Issue already created",
              issueUrl: existingIssue.github_issue_url,
              issueNumber: existingIssue.github_issue_number,
              plainSummary: existingIssue.plain_summary,
            })));
            ctrl.close();
          },
        });
        return withCors(new Response(replayStream, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        }), req);
      }
    }
    return withCors(Response.json({ error: "Submission already being processed" }, { status: 409 }), req);
  }

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
        const navigationBreadcrumb = (sub as any).navigation_breadcrumb as Array<{url: string; title: string; ts: string}> | null;
        const componentHint = (sub as any).component_hint as string | null;
        const attachmentUrls = (sub as any).attachment_urls as Array<{url: string; type: string; name: string}> | null;
        const consoleErrors = (sub as any).console_errors as string[] | null;
        const consoleWarnings = (sub as any).console_warnings as string[] | null;

        // Import the BAML client generated by baml-cli generate
        // Path: baml_client/ at repo root → 6 levels up from this route file
        const { b } = await import("baml_client");

        const bamlMetadata = sub.metadata as SubmissionMetadata;
        const screenshotKinds = getScreenshotKinds(attachmentUrls);

        // ── Routing: decide target repo ──────────────────────────────────────────
        let targetRepo = body.repo;
        let repoDecision: PanelRepoDecision = "app";
        if (body.panelRepo) {
          send({ type: "progress", message: "Routing to correct repo…" });
          const routing = await b.RouteToRepo(
            sanitizeTranscript(sub.transcript as ConversationTurn[]),
            bamlMetadata,
            screenshotKinds,
          );
          repoDecision = routing.target === "panel" ? "panel" : "app";
          targetRepo = repoDecision === "panel" ? body.panelRepo : body.repo;
          send({ type: "progress", message: "Routing decision recorded…" });
        }
        const routingTarget = toRoutingTarget(repoDecision);
        send({
          type: "routing",
          target: repoDecision,
          routingTarget,
          targetRepo,
        });

        // Fetch repo context for enrichment
        send({ type: "progress", message: "Gathering repository context…" });

        const { owner, repo } = parseRepo(targetRepo);
        const octokit = getGitHubClient(sub.tier as "guest" | "contractor" | "team");

        const [{ data: labels }, { data: issues }] = await Promise.all([
          octokit.issues.listLabelsForRepo({ owner, repo, per_page: 50 }),
          octokit.issues.listForRepo({ owner, repo, state: "open", per_page: 20 }),
        ]);

        const repoContext = {
          labels: labels.map((l) => ({ name: l.name, description: l.description ?? undefined, color: l.color })),
          recentIssues: issues.map((i) => ({ number: i.number, title: i.title, state: i.state, url: i.html_url })),
        };

        send({ type: "progress", message: "Classifying issue…" });

        let issueInput = {
          transcript: sanitizeTranscript(sub.transcript as ConversationTurn[]),
          metadata: bamlMetadata,
          repo_context: repoContext,
          tier: sub.tier,
          console_errors: consoleErrors ?? undefined,
          console_warnings: consoleWarnings ?? undefined,
          // Map ts → timestamp to match BAML NavigationEntry schema
          navigation_breadcrumb: navigationBreadcrumb
            ? navigationBreadcrumb.map(e => ({ url: e.url, title: e.title, timestamp: e.ts }))
            : undefined,
          component_hint: componentHint ?? undefined,
          attachment_urls: attachmentUrls ?? undefined,
        };

        const classification = await b.ClassifyIssue(issueInput);

        send({ type: "progress", message: "Enriching with context…" });
        const enrichment = await b.EnrichWithRepoContext(issueInput, classification);

        // For team tier: fetch relevant file contents and run fix analysis
        let fixSuggestion: { relevant_functions: string[]; root_cause: string; suggested_approach: string; code_hint?: string | null; confidence: string } | null = null;

        if (sub.tier === "team" && enrichment.relevant_files.length > 0) {
          send({ type: "progress", message: "Analysing source files…" });

          const FILE_LIMIT = 5;
          const CONTENT_LIMIT = 8000;
          const filesToFetch = enrichment.relevant_files.slice(0, FILE_LIMIT);
          const fileContents: Record<string, string> = {};

          await Promise.allSettled(
            filesToFetch.map(async (filePath) => {
              try {
                const { data } = await octokit.repos.getContent({ owner, repo, path: filePath });
                if ("content" in data && typeof data.content === "string") {
                  const decoded = Buffer.from(data.content, "base64").toString("utf8");
                  fileContents[filePath] = decoded.slice(0, CONTENT_LIMIT);
                }
              } catch {
                // file not found or not a file — skip silently
              }
            })
          );

          if (Object.keys(fileContents).length > 0) {
            issueInput = {
              ...issueInput,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              repo_context: { ...repoContext, file_contents: fileContents } as any,
            };
            fixSuggestion = await b.SuggestFix(issueInput, classification, enrichment);
          }
        }

        send({ type: "progress", message: "Formatting issue…" });
        type FormattedIssue = {
          github_title: string;
          issue_sections: PanelIssueSections;
          labels: string[];
          issue_markers: {
            panel_source: string;
            panel_submission_id: string;
            panel_product_key: string;
            panel_target: string;
            panel_repo_decision: string;
            panel_intake_candidate: string;
            panel_screenshot_kinds: string;
            panel_summary_ref: string;
            panel_pipeline_hint: string;
          };
          pipeline_handoff: {
            status: PanelPipelineHandoff["status"];
            pipeline_hint: string;
            forwardable_metadata_summary: string;
          };
          assignee?: string;
          plain_summary: string;
          technical_details: string;
          priority: string;
        };
        let issueOutput: FormattedIssue;
        try {
          issueOutput = await b.FormatAsGitHubIssue(
            issueInput,
            classification,
            enrichment,
            fixSuggestion,
          ) as unknown as FormattedIssue;
        } catch (fmtErr) {
          if (fmtErr instanceof BamlValidationError) {
            console.warn("[process] FormatAsGitHubIssue failed, retrying with ClaudeSonnet:", (fmtErr as Error).message);
            send({ type: "progress", message: "Retrying format with fallback model…" });
            issueOutput = await b.FormatAsGitHubIssue(
              issueInput,
              classification,
              enrichment,
              fixSuggestion,
              { client: "ClaudeSonnet" },
            ) as unknown as FormattedIssue;
          } else {
            throw fmtErr;
          }
        }

        const handoffStatus = issueOutput.pipeline_handoff.status === "candidate"
          ? "candidate"
          : "deferred";
        const forwardableMetadata = buildForwardableMetadata({
          metadata: bamlMetadata,
          githubLogin: sub.github_login,
          selectedModelId: ((sub as unknown as { selected_model_id?: string | null }).selected_model_id) ?? null,
          componentHint,
          screenshotKinds,
          navigationBreadcrumb: navigationBreadcrumb ?? null,
          contextSummary: issueOutput.pipeline_handoff.forwardable_metadata_summary,
        });
        const issueLabels = buildIssueLabels({
          formatterLabels: issueOutput.labels,
          routingTarget,
          handoffStatus,
        });
        const issueMarkers = buildIssueMarkers({
          submissionId: id,
          productKey: key.productKey,
          routingTarget,
          repoDecision,
          handoffStatus,
          screenshotKinds,
          plainSummary: issueOutput.plain_summary,
          pipelineHint: issueOutput.pipeline_handoff.pipeline_hint,
          formatterMarkers: issueOutput.issue_markers,
        });
        const pipelineHandoff: PanelPipelineHandoff = {
          status: handoffStatus,
          repoDecision,
          routingTarget,
          targetRepo,
          issueLabels,
          trackingMarkers: issueMarkers,
          forwardableMetadata,
          pipelineHint: issueOutput.pipeline_handoff.pipeline_hint,
        };
        const technicalDetails: PanelIssueTechnicalDetails = {
          priority: issueOutput.priority,
          rawSummary: issueOutput.technical_details,
          issueSections: issueOutput.issue_sections,
          issueMarkers,
          pipelineHandoff,
        };
        const githubBody = renderIssueBody(issueOutput.issue_sections, issueMarkers);

        // Create GitHub issue
        send({ type: "progress", message: "Creating GitHub issue…" });
        const { data: createdIssue } = await octokit.issues.create({
          owner,
          repo,
          title: issueOutput.github_title,
          body: githubBody,
          labels: issueLabels,
          assignees: issueOutput.assignee ? [issueOutput.assignee] : undefined,
        });

        // Persist result
        await supabase.from("panel_issues").insert({
          submission_id: id,
          github_issue_number: createdIssue.number,
          github_issue_url: createdIssue.html_url,
          plain_summary: issueOutput.plain_summary,
          technical_details: technicalDetails,
          labels: issueLabels,
        });

        if (pipelineHandoff.status === "candidate") {
          send({
            type: "pipeline_handoff",
            message: "Pipeline handoff candidate recorded",
            target: pipelineHandoff.repoDecision,
            routingTarget: pipelineHandoff.routingTarget,
            targetRepo: pipelineHandoff.targetRepo,
            handoffStatus: pipelineHandoff.status,
            issueLabels: pipelineHandoff.issueLabels,
            trackingMarkers: pipelineHandoff.trackingMarkers,
            forwardableMetadata: pipelineHandoff.forwardableMetadata,
            pipelineHint: pipelineHandoff.pipelineHint,
          });
        }

        await supabase
          .from("panel_submissions")
          .update({ status: "completed" })
          .eq("id", id);

        send({
          type: "completed",
          message: "Issue created successfully",
          issueUrl: createdIssue.html_url,
          issueNumber: createdIssue.number,
          title: issueOutput.github_title,
          plainSummary: issueOutput.plain_summary,
        });
      } catch (err) {
        console.error("Process pipeline error:", err);
        await supabase
          .from("panel_submissions")
          .update({ status: "failed", error_message: err instanceof Error ? err.message : String(err) })
          .eq("id", id);
        send({ type: "error", message: err instanceof Error ? err.message : "Pipeline failed" });
      }

      controller.close();
    },
  });

  return withCors(new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  }), req);
}
