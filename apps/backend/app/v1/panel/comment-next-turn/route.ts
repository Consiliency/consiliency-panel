import { unauthorized, validateApiKey } from "@/lib/auth";
import { isRateLimited, tooManyRequests } from "@/lib/ratelimit";
import { getServiceSupabase } from "@/lib/supabase";
import { corsPreflight, withCors } from "@/lib/cors";
import {
  DEFAULT_MODEL_ID,
  isBetaModelSelectionEnabled,
  resolveBamlClient,
} from "@/lib/model-catalog";
import {
  fromBamlFacts,
  toBamlFacts,
} from "@/lib/known-facts";
import { buildAppContext, checkTopic, scrubSecrets } from "@/lib/agent-guardrails";
import type { ConversationTurn, KnownFacts, ToolCall } from "@consiliency/panel-types";

export async function OPTIONS(req: Request) { return corsPreflight(req); }

const MAX_TURN_CONTENT = 4000;

function sanitize(text: string): string {
  return scrubSecrets(
    text
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .slice(0, MAX_TURN_CONTENT),
  );
}

interface CommentNextTurnBody {
  submissionId: string;
  issueNumber: number;
  issueUrl: string;
  issueBody: string;
  userText: string;
  transcript: ConversationTurn[];
  knownFacts?: KnownFacts;
  selectedModelId?: string;
  repo: string;
  panelRepo?: string;
}

function toToolCall(out: {
  type: string;
  question?: string | null;
  reason?: string | null;
  options?: string[] | null;
  redirect?: string | null;
  draft?: { title: string; body: string; severity: string; kind: string } | null;
}): ToolCall {
  switch (out.type) {
    case "ask_follow_up":
      return {
        type: "ask_follow_up",
        question: out.question ?? "Tell me more?",
        reason: out.reason ?? "",
      };
    case "refuse_off_topic":
      return {
        type: "refuse_off_topic",
        redirect:
          out.redirect ??
          "Let's stay on the existing issue — what would you like to add?",
      };
    case "draft_issue":
    case "revise_draft": {
      const d = out.draft ?? { title: "", body: "", severity: "medium", kind: "bug" };
      const sev = d.severity;
      const kind = d.kind;
      return {
        type: out.type === "revise_draft" ? "revise_draft" : "draft_issue",
        draft: {
          title: d.title,
          body: d.body,
          severity:
            sev === "blocker" || sev === "high" || sev === "medium" || sev === "low"
              ? sev
              : "medium",
          kind:
            kind === "bug" || kind === "feature" || kind === "feedback" || kind === "other"
              ? kind
              : "feedback",
        },
      };
    }
    default:
      return {
        type: "ask_follow_up",
        question: "What would you like to add?",
        reason: "agent returned unknown tool call",
      };
  }
}

export async function POST(req: Request): Promise<Response> {
  const key = await validateApiKey(req);
  if (!key) return withCors(unauthorized(), req);
  if (await isRateLimited(key.productKey)) return withCors(tooManyRequests(), req);

  let body: CommentNextTurnBody;
  try {
    body = (await req.json()) as CommentNextTurnBody;
  } catch {
    return withCors(Response.json({ error: "Invalid JSON body" }, { status: 400 }), req);
  }

  if (!body.userText?.trim() || !body.submissionId || !body.issueNumber) {
    return withCors(Response.json({ error: "Missing required fields" }, { status: 400 }), req);
  }

  const userText = sanitize(body.userText);
  const appContext = buildAppContext(body.repo, body.panelRepo);

  const topic = await checkTopic(userText, appContext);
  if (!topic.onTopic) {
    return withCors(
      Response.json({
        toolCall: {
          type: "refuse_off_topic",
          redirect:
            topic.redirectHint ??
            "Let's stay on the existing issue — what would you like to add?",
        } as ToolCall,
        knownFacts: body.knownFacts ?? {},
      }),
      req,
    );
  }

  const supabase = getServiceSupabase();

  // Upsert a draft row for this issue+submission
  const { data: existing } = await supabase
    .from("panel_comment_drafts")
    .select("id, known_facts, transcript")
    .eq("submission_id", body.submissionId)
    .eq("github_issue_number", body.issueNumber)
    .eq("status", "drafting")
    .maybeSingle();

  const sanitizedTranscript = (body.transcript ?? []).slice(-40).map((t) => ({
    ...t,
    content: sanitize(t.content),
  }));

  let draftRowId: string;
  if (!existing) {
    const { data: created, error } = await supabase
      .from("panel_comment_drafts")
      .insert({
        submission_id: body.submissionId,
        product_key: key.productKey,
        github_login: null,
        github_issue_number: body.issueNumber,
        github_issue_url: body.issueUrl,
        issue_body: body.issueBody,
        transcript: sanitizedTranscript,
        known_facts: body.knownFacts ?? {},
        selected_model_id: body.selectedModelId ?? DEFAULT_MODEL_ID,
      })
      .select("id")
      .single();
    if (error || !created) {
      console.error("[comment-next-turn] insert failed:", error);
      return withCors(
        Response.json({ error: "Failed to create comment draft" }, { status: 500 }),
        req,
      );
    }
    draftRowId = created.id as string;
  } else {
    draftRowId = existing.id as string;
    await supabase
      .from("panel_comment_drafts")
      .update({
        transcript: sanitizedTranscript,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftRowId);
  }

  const { b } = await import("baml_client");

  let knownFacts: KnownFacts = body.knownFacts ?? {};
  try {
    const merged = await b.UpdateKnownFacts(toBamlFacts(knownFacts), userText);
    knownFacts = fromBamlFacts(merged as unknown as Parameters<typeof fromBamlFacts>[0]);
    await supabase
      .from("panel_comment_drafts")
      .update({ known_facts: knownFacts })
      .eq("id", draftRowId);
  } catch (err) {
    console.warn("[comment-next-turn] UpdateKnownFacts failed:", err);
  }

  const betaEnabled = isBetaModelSelectionEnabled();
  const clientName = resolveBamlClient(
    betaEnabled ? body.selectedModelId ?? DEFAULT_MODEL_ID : DEFAULT_MODEL_ID,
  );

  let toolCall: ToolCall;
  try {
    const out = await b.NextCommentTurn(
      body.issueBody,
      sanitizedTranscript.map((t) => ({
        role: t.role,
        content: t.content,
        timestamp: t.timestamp,
      })),
      toBamlFacts(knownFacts),
      appContext,
      { client: clientName },
    );
    toolCall = toToolCall(out as unknown as Parameters<typeof toToolCall>[0]);
  } catch (err) {
    console.error("[comment-next-turn] NextCommentTurn failed:", err);
    return withCors(
      Response.json({ error: "Agent call failed" }, { status: 502 }),
      req,
    );
  }

  if (toolCall.type === "draft_issue" || toolCall.type === "revise_draft") {
    await supabase
      .from("panel_comment_drafts")
      .update({ draft_body: toolCall.draft.body, updated_at: new Date().toISOString() })
      .eq("id", draftRowId);
  }

  return withCors(
    Response.json({
      draftId: draftRowId,
      toolCall,
      knownFacts,
    }),
    req,
  );
}
