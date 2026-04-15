import type { KnownFacts } from "@consiliency/panel-types";
import { getServiceSupabase } from "./supabase";

type BamlKnownFacts = {
  action?: string | null;
  actual?: string | null;
  expected?: string | null;
  severity?: string | null;
  repro_steps?: string[] | null;
  first_seen?: string | null;
  frequency?: string | null;
  kind?: string | null;
};

export function toBamlFacts(f: KnownFacts | null | undefined): BamlKnownFacts {
  if (!f) return {};
  return {
    action: f.action ?? null,
    actual: f.actual ?? null,
    expected: f.expected ?? null,
    severity: f.severity ?? null,
    repro_steps: f.reproSteps ?? null,
    first_seen: f.firstSeen ?? null,
    frequency: f.frequency ?? null,
    kind: f.kind ?? null,
  };
}

export function fromBamlFacts(b: BamlKnownFacts | null | undefined): KnownFacts {
  if (!b) return {};
  const sev = b.severity ?? undefined;
  const kind = b.kind ?? undefined;
  return {
    action: b.action ?? undefined,
    actual: b.actual ?? undefined,
    expected: b.expected ?? undefined,
    severity:
      sev === "blocker" || sev === "high" || sev === "medium" || sev === "low"
        ? sev
        : undefined,
    reproSteps: b.repro_steps ?? undefined,
    firstSeen: b.first_seen ?? undefined,
    frequency: b.frequency ?? undefined,
    kind:
      kind === "bug" || kind === "feature" || kind === "feedback" || kind === "other"
        ? kind
        : undefined,
  };
}

export async function getKnownFacts(submissionId: string): Promise<KnownFacts> {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("panel_submissions")
    .select("known_facts")
    .eq("id", submissionId)
    .single();
  return (data?.known_facts as KnownFacts) ?? {};
}

export async function persistKnownFacts(
  submissionId: string,
  facts: KnownFacts,
): Promise<void> {
  const supabase = getServiceSupabase();
  await supabase
    .from("panel_submissions")
    .update({ known_facts: facts })
    .eq("id", submissionId);
}
