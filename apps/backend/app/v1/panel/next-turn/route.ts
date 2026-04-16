import { resolveUserTier, unauthorized, validateApiKey } from "@/lib/auth";
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
  getKnownFacts,
  persistKnownFacts,
  toBamlFacts,
} from "@/lib/known-facts";
import { buildAppContext, checkTopic, scrubSecrets } from "@/lib/agent-guardrails";
import type {
  ConversationTurn,
  IssueDraft,
  IssueKind,
  IssueSeverity,
  NextTurnRequest,
  NextTurnResponse,
  ToolCall,
} from "@consiliency/panel-types";

export async function OPTIONS(req: Request) { return corsPreflight(req); }

const MAX_TURN_CONTENT = 4000;
const MAX_TRANSCRIPT_TURNS = 40;

function sanitize(text: string): string {
  return scrubSecrets(
    text
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .slice(0, MAX_TURN_CONTENT),
  );
}

function sanitizeTurns(turns: ConversationTurn[]): ConversationTurn[] {
  return turns.slice(-MAX_TRANSCRIPT_TURNS).map((t) => ({
    ...t,
    content: sanitize(t.content),
  }));
}

function normalizeSeverity(s: string | null | undefined): IssueSeverity {
  if (s === "blocker" || s === "high" || s === "medium" || s === "low") return s;
  return "medium";
}

function normalizeKind(k: string | null | undefined): IssueKind {
  if (k === "bug" || k === "feature" || k === "feedback" || k === "other") return k;
  return "bug";
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
        question: out.question ?? "Can you tell me more?",
        reason: out.reason ?? "",
      };
    case "clarify_intent":
      return {
        type: "clarify_intent",
        question: out.question ?? "What kind of feedback is this?",
        options: out.options ?? ["bug", "feature", "feedback", "other"],
      };
    case "refuse_off_topic":
      return {
        type: "refuse_off_topic",
        redirect:
          out.redirect ??
          "I can only help with feedback about this app — is there something about it you want to report?",
      };
    case "revise_draft":
    case "draft_issue": {
      const d = out.draft ?? { title: "", body: "", severity: "medium", kind: "bug" };
      const draft: IssueDraft = {
        title: d.title,
        body: d.body,
        severity: normalizeSeverity(d.severity),
        kind: normalizeKind(d.kind),
      };
      return { type: out.type === "revise_draft" ? "revise_draft" : "draft_issue", draft };
    }
    default:
      return {
        type: "ask_follow_up",
        question: "Can you tell me more about what happened?",
        reason: "agent returned unknown tool call type",
      };
  }
}

export async function POST(req: Request): Promise<Response> {
  const key = await validateApiKey(req);
  if (!key) return withCors(unauthorized(), req);

  if (await isRateLimited(key.productKey)) return withCors(tooManyRequests(), req);

  let body: NextTurnRequest;
  try {
    body = (await req.json()) as NextTurnRequest;
  } catch {
    return withCors(Response.json({ error: "Invalid JSON body" }, { status: 400 }), req);
  }

  if (!body.userText?.trim()) {
    return withCors(Response.json({ error: "userText is required" }, { status: 400 }), req);
  }

  const userText = sanitize(body.userText);
  const tier = body.githubLogin
    ? await resolveUserTier(body.githubLogin, key.productKey, key.maxTier)
    : key.maxTier;

  const supabase = getServiceSupabase();
  const appContext = buildAppContext(body.repo, body.panelRepo);

  // Off-topic short-circuit — skip for follow-up turns (first message was already validated).
  const userTurnCount = (body.transcript ?? []).filter((t: { role: string }) => t.role === "user").length;
  if (userTurnCount < 1) {
    const topic = await checkTopic(userText, appContext);
    if (!topic.onTopic) {
      const redirect =
        topic.redirectHint ??
        "I can only help with feedback about this app — is there something about it you want to report?";
      return withCors(
        Response.json({
          submissionId: body.submissionId ?? null,
          toolCall: { type: "refuse_off_topic", redirect } as ToolCall,
          knownFacts: {},
        } satisfies Partial<NextTurnResponse> as NextTurnResponse),
        req,
      );
    }
  }

  // Resolve/create the submission row lazily (agentic flow)
  let submissionId = body.submissionId;
  if (!submissionId) {
    const { data: created, error: insertErr } = await supabase
      .from("panel_submissions")
      .insert({
        product_key: key.productKey,
        github_login: body.githubLogin ?? null,
        tier,
        transcript: sanitizeTurns(body.transcript ?? []),
        metadata: body.metadata,
        screenshot_url: body.screenshotUrl ?? null,
        navigation_breadcrumb: body.navigationBreadcrumb ?? null,
        component_hint: body.componentHint ?? null,
        attachment_urls: body.attachmentUrls ?? null,
        status: "drafting",
        selected_model_id: isBetaModelSelectionEnabled()
          ? body.selectedModelId ?? DEFAULT_MODEL_ID
          : DEFAULT_MODEL_ID,
        known_facts: {},
      })
      .select("id")
      .single();

    if (insertErr || !created) {
      console.error("[next-turn] submission insert failed:", insertErr);
      return withCors(
        Response.json({ error: "Failed to create submission" }, { status: 500 }),
        req,
      );
    }
    submissionId = created.id as string;
  } else {
    // Append the latest transcript + refresh selected model
    await supabase
      .from("panel_submissions")
      .update({
        transcript: sanitizeTurns(body.transcript ?? []),
        navigation_breadcrumb: body.navigationBreadcrumb ?? null,
        attachment_urls: body.attachmentUrls ?? null,
        screenshot_url: body.screenshotUrl ?? null,
        selected_model_id: isBetaModelSelectionEnabled()
          ? body.selectedModelId ?? DEFAULT_MODEL_ID
          : DEFAULT_MODEL_ID,
      })
      .eq("id", submissionId)
      .eq("product_key", key.productKey);
  }

  // Load prior known facts, update with the latest user text
  const prior = await getKnownFacts(submissionId);

  const { b } = await import("baml_client");

  let updatedFacts = prior;
  try {
    const merged = await b.UpdateKnownFacts(toBamlFacts(prior), userText);
    updatedFacts = fromBamlFacts(merged as unknown as Parameters<typeof fromBamlFacts>[0]);
    await persistKnownFacts(submissionId, updatedFacts);
  } catch (err) {
    console.warn("[next-turn] UpdateKnownFacts failed, continuing with prior facts:", err);
  }

  // Resolve which BAML client to invoke NextTurn with
  const betaEnabled = isBetaModelSelectionEnabled();
  const selectedModelId = betaEnabled ? body.selectedModelId ?? DEFAULT_MODEL_ID : DEFAULT_MODEL_ID;
  const clientName = resolveBamlClient(selectedModelId);

  const bamlMetadata = {
    ...body.metadata,
    viewport:
      typeof body.metadata?.viewport === "object"
        ? `${body.metadata.viewport.width}x${body.metadata.viewport.height}`
        : String(body.metadata?.viewport ?? ""),
  };

  const turns = sanitizeTurns(body.transcript ?? []);

  let toolCall: ToolCall;
  try {
    const out = await b.NextTurn(
      toBamlFacts(updatedFacts),
      turns.map((t) => ({
        role: t.role,
        content: t.content,
        timestamp: t.timestamp,
      })),
      bamlMetadata,
      appContext,
      body.screenshotUrl ?? null,
      updatedFacts.kind ?? null,
      { client: clientName },
    );
    toolCall = toToolCall(out as unknown as Parameters<typeof toToolCall>[0]);
  } catch (err) {
    console.error("[next-turn] NextTurn call failed:", err);
    return withCors(
      Response.json({ error: "Agent call failed" }, { status: 502 }),
      req,
    );
  }

  // If the agent emitted a draft, persist it to metadata so /submit can pick it up
  if (toolCall.type === "draft_issue" || toolCall.type === "revise_draft") {
    const { data: row } = await supabase
      .from("panel_submissions")
      .select("metadata")
      .eq("id", submissionId)
      .single();
    const meta = ((row?.metadata as Record<string, unknown>) ?? {}) as Record<string, unknown>;
    await supabase
      .from("panel_submissions")
      .update({
        metadata: { ...meta, draft: toolCall.draft },
        kind: toolCall.draft.kind,
      })
      .eq("id", submissionId);
  }

  const res: NextTurnResponse = {
    submissionId,
    toolCall,
    knownFacts: updatedFacts,
  };

  return withCors(Response.json(res), req);
}
