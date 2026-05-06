# PANELPROOF Acceptance Packet

This document is the Panel-owned release and handoff packet for Phase 4
(`PANELPROOF`) in [`specs/phase-plans-v1.md`](../specs/phase-plans-v1.md).
It proves the feedback-to-pipeline intake artifact that Panel creates, records
the safe verification path, and states exactly what downstream repos may
consume now versus what remains deferred.

## Proof scope

`PANELPROOF` freezes one Panel-generated GitHub issue artifact plus the bounded
SSE and persistence surfaces that accompany it:

- GitHub issue body sections:
  `## Summary`, `## User-approved details`, `## Environment`, `## Routing`,
  `## Pipeline intake handoff`, `## Linked evidence`
- labels:
  `source:panel`, one routing target label, and either
  `pipeline-intake:candidate` or `pipeline-intake:deferred`
- tracking markers:
  `panel_source`, `panel_submission_id`, `panel_product_key`, `panel_target`,
  `panel_repo_decision`, `panel_intake_candidate`, `panel_screenshot_kinds`,
  `panel_summary_ref`, `panel_pipeline_hint`
- process-route proof surfaces:
  `routing`, optional `pipeline_handoff`, and `completed`
- persisted handoff metadata:
  bounded `forwardableMetadata`, labels, markers, target repo, and handoff
  status stored in `technical_details.pipelineHandoff`

Panel does not prove Portal rollout or Governed Pipeline runtime ownership
here. It proves only that the Panel artifact is stable and safe for those
downstream consumers to identify, ingest, or defer against.

## Version and environment capture

Run the proof from the checkout that is being handed off and record these
values alongside the verification output:

- repo: `consiliency-panel`
- roadmap: `specs/phase-plans-v1.md`
- phase: `PANELPROOF`
- commit: `6b7827aa9f898aaf737e962b668ad5b67c5bd048`
- short commit: `6b7827a`
- runtime: local `pnpm` workspace from `/home/viperjuice/code/consiliency-panel`

If the proof is rerun after additional commits, update the recorded commit and
preserve the same acceptance-artifact shape.

## Proof commands

Run the focused checks below:

```bash
pnpm --filter @consiliency/panel-backend exec vitest run __tests__/api/process.test.ts
pnpm --filter @consiliency/panel-backend exec tsc -p tsconfig.json --noEmit
pnpm --filter @consiliency/panel-core exec vitest run src/__tests__/client.test.ts
pnpm --filter @consiliency/panel-core build
rg -n "PANELPROOF|acceptance proof|redact|rollback|next adoption step|pipeline intake" README.md docs/embedder-contract.md docs/panelproof-acceptance.md
rg -n "PFOOT|PILOT|PANELPROOF|GPACCEPT|defer|rollback|next adoption step" docs/panelproof-acceptance.md ../consiliency-portal/specs/phase-plans-v8.md ../governed-pipeline/specs/phase-plans-v3.md
```

## Expected Panel artifact shape

The acceptance proof is satisfied when one controlled submission produces all
of the following:

- a GitHub issue whose body preserves the frozen section headings and uses the
  `## Pipeline intake handoff` section only for bounded intake metadata plus
  tracking markers
- candidate labels when the issue qualifies for downstream intake:
  `source:panel`, `target:host_app` or `target:panel_widget`,
  `target:pipeline_intake`, `pipeline-intake:candidate`
- deferred labels when the issue should stay issue-only for now:
  `source:panel`, one routing target label, `pipeline-intake:deferred`, and no
  `target:pipeline_intake`
- a `pipeline_handoff` SSE event only for candidate flows
- a persisted `technical_details.pipelineHandoff` record for both candidate and
  deferred flows
- replay-safe completion behavior where an already-completed submission replays
  the stored candidate handoff metadata before `completed`

## Portal linkage expectation

Portal v8 treats `PANELPROOF` as an input to `PILOT`, not as a prerequisite to
`PFOOT`. The relevant downstream contract is:

- `../consiliency-portal/specs/phase-plans-v8.md`
- `IF-0-PILOT-1` requires that Panel feedback intake is either proven through
  `IF-0-PANELPROOF-1` or explicitly deferred with honest product copy

Portal should use the Panel-created issue as an intake candidate by matching:

- the issue URL and number emitted by the `completed` event
- the `pipeline_handoff` event fields when present:
  `target`, `routingTarget`, `targetRepo`, `handoffStatus`, `issueLabels`,
  `trackingMarkers`, `forwardableMetadata`, `pipelineHint`
- the persisted marker and label set on the issue itself

Portal does not need transcript dumps or screenshot payloads to link the
artifact. The Panel proof remains valid so long as Portal consumes the bounded
issue metadata and treats missing downstream adoption as an honest pilot
limitation rather than silent success.

## Governed Pipeline consume-or-defer status

Governed Pipeline v3 freezes its own acceptance entrypoints in `GPACCEPT`.
The relevant downstream contract is:

- `../governed-pipeline/specs/phase-plans-v3.md`
- `IF-0-GPACCEPT-1` freezes packed or released `pipeline-init` plus
  `pipeline-preflight --json` as the authoritative acceptance entrypoints for
  pilot evidence

Current status for `PANELPROOF`:

- Panel proves the GitHub issue artifact and bounded handoff metadata that
  downstream consumers may identify.
- Governed Pipeline does not yet claim, from this repo alone, that it directly
  ingests the Panel issue artifact as a live acceptance entrypoint.
- Therefore the downstream consume state is:
  `defer to Governed Pipeline GPACCEPT and Portal PILOT for live ingestion proof`

This is an exact deferral, not a generic future-work note. If downstream repos
later add a concrete issue-ingest or artifact-linking contract, this packet
should be updated to cite that contract by phase and interface name.

## Redaction boundary

Acceptance evidence must not include:

- raw API keys
- GitHub tokens
- full transcripts
- raw screenshot payloads
- raw console dumps
- secret environment values

Safe evidence may include:

- test names and pass/fail status
- issue section headings and bounded safe excerpts
- labels
- tracking markers
- safe metadata fields such as page URL/title, submission timestamp, component
  hint, screenshot kinds, and bounded summaries
- issue URLs, issue numbers, and repo identifiers

## Rollback

If this proof becomes misleading or downstream consumers reject the artifact
shape, roll back only the Panel-owned proof surfaces:

1. remove or adjust the acceptance-oriented test assertions in
   `apps/backend/__tests__/api/process.test.ts` and
   `packages/core/src/__tests__/client.test.ts`
2. revert the proof-packet references in `README.md` and
   `docs/embedder-contract.md`
3. update this packet to reflect the restored or revised contract boundary

Do not use `PANELPROOF` rollback to change Portal product copy, Governed
Pipeline runtime behavior, or Message Board callback scope.

## Next adoption step

The next downstream adoption move is:

- Portal `PILOT` should consume this packet as the Panel-side proof or preserve
  an explicit deferral using the same `IF-0-PANELPROOF-1` reference.
- Governed Pipeline `GPACCEPT` remains the authoritative place to prove live
  acceptance entrypoints and any future issue-artifact ingestion contract.

No roadmap amendment is required from this proof run because the existing
Portal and Governed Pipeline downstream phases already describe the same
consume-or-defer boundary.
