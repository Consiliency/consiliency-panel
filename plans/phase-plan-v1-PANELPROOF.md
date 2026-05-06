---
phase_loop_plan_version: 1
phase: PANELPROOF
roadmap: specs/phase-plans-v1.md
roadmap_sha256: cf672eb20092894bc58b47cb2023cad63469daf770736a50550324ec36c3b93a
---

# PANELPROOF: Feedback-To-Pipeline Acceptance Proof

## Context

Roadmap source: `specs/phase-plans-v1.md`, Phase 4 (`PANELPROOF`). The selected
roadmap hash matches the canonical `.phase-loop/state.json` value
`cf672eb20092894bc58b47cb2023cad63469daf770736a50550324ec36c3b93a`.

Canonical runner state currently marks `PANELINTAKE`, `PANELAUTH`, and
`PANELROUTE` complete, with `PANELPROOF` blocked on downstream acceptance
readiness. The local Panel-owned prerequisite `IF-0-PANELROUTE-1` is already
frozen, so this phase no longer waits on `plans/phase-plan-v1-PANELROUTE.md`.
The remaining execution gate is external to this repo: local
`../consiliency-portal` must provide `IF-0-PFOOT-1`, and local
`../governed-pipeline` must provide `IF-0-GPACCEPT-1`. Portal `PILOT`
consumes `PANELPROOF` evidence or an explicit deferral; `PANELPROOF` must not
wait for Portal `PILOT`.

The repo already has most of the local proof substrate that this phase should
consume rather than redesign. `packages/types/src/panel.ts` freezes the
pipeline-intake vocabulary, `apps/backend/app/v1/panel/process/[id]/route.ts`
already renders the frozen issue sections and emits bounded `pipeline_handoff`
events, `apps/backend/__tests__/api/process.test.ts` already covers candidate,
deferred, replay, and `panelRepo` routing cases, and
`packages/core/src/__tests__/client.test.ts` already proves that the SDK
forwards `pipeline_handoff` events unchanged. The main missing piece is an
acceptance-proof layer that turns those surfaces into a release/handoff packet
Portal and Governed Pipeline can consume honestly.

Cross-repo readiness is partially outside this repository. Portal v8 says its
pilot phase can accept either real `IF-0-PANELPROOF-1` evidence or an explicit
deferral, while Governed Pipeline v3 says `GPACCEPT` owns the downstream
acceptance fixtures it will expose to Portal. `PANELPROOF` should therefore
prove the Panel-owned portion end-to-end, name the exact Panel-generated issue
artifact that downstream repos must identify, and document any remaining
Portal/Governed Pipeline gap with an exact contract reference instead of vague
"future integration" language.

## Interface Freeze Gates

- [ ] IF-0-PANELPROOF-1 - The acceptance-proof contract is frozen around one
  Panel-generated GitHub issue artifact whose body sections, labels, tracking
  markers, `pipeline_handoff` event payload, and persisted handoff metadata all
  match the `PANELINTAKE` and `PANELROUTE` contracts exactly.
- [ ] IF-0-PANELPROOF-2 - `apps/backend/__tests__/api/process.test.ts` names a
  focused proof scenario that asserts the exact issue-body sections, candidate
  labels, tracking-marker payload, bounded forwardable metadata, deferred
  fallback, and replay behavior without leaking transcript dumps, raw console
  logs, API keys, tokens, or secret env values.
- [ ] IF-0-PANELPROOF-3 - `packages/core/src/__tests__/client.test.ts` names a
  focused SDK proof scenario that confirms `streamProcess()` preserves the
  `routing -> pipeline_handoff -> completed` acceptance path and does not
  regress `repo` / `panelRepo` request semantics.
- [ ] IF-0-PANELPROOF-4 - `docs/panelproof-acceptance.md` freezes the
  cross-repo handoff packet: version/commit, environment, proof commands,
  created-issue evidence shape, Portal linkage expectation, Governed Pipeline
  consume-or-defer status, rollback path, and next adoption step.
- [ ] IF-0-PANELPROOF-5 - `README.md` and `docs/embedder-contract.md` point to
  the acceptance-proof packet and restate the redaction boundary for proof
  artifacts: no raw API keys, GitHub tokens, full transcripts, raw screenshot
  payloads, or secret environment values are recorded.

## Lane Index & Dependencies

- SL-0 - Proof contract anchors and docs preamble; Depends on: (none); Blocks:
  SL-1, SL-2, SL-3, SL-4; Parallel-safe: no
- SL-1 - Backend acceptance proof fixture; Depends on: SL-0; Blocks: SL-3,
  SL-4; Parallel-safe: yes
- SL-2 - SDK acceptance proof fixture; Depends on: SL-0; Blocks: SL-3, SL-4;
  Parallel-safe: yes
- SL-3 - Cross-repo proof packet and deferral mapping; Depends on: SL-0, SL-1,
  SL-2; Blocks: SL-4; Parallel-safe: no
- SL-4 - Acceptance and release-handoff reducer; Depends on: SL-1, SL-2, SL-3;
  Blocks: (none); Parallel-safe: no

## Lanes

### SL-0 - Proof contract anchors and docs preamble

- **Scope**: Freeze where `PANELPROOF` records acceptance status and redaction
  rules before writing proof fixtures or downstream handoff docs.
- **Owned files**: `README.md`, `docs/embedder-contract.md`
- **Interfaces provided**: IF-0-PANELPROOF-5,
  `PANELPROOF-docs-redaction-boundary`, `PANELPROOF-proof-doc-anchor`
- **Interfaces consumed**: pre-existing `PANEL_PIPELINE_INTAKE_CONTRACT`,
  `PANELROUTE-process-sse-contract`, Portal `IF-0-PFOOT-1`, Governed Pipeline
  `IF-0-GPACCEPT-1`
- **Parallel-safe**: no
- **Tasks**:
  - test: audit the current README and embedder contract for where they already
    describe pipeline-intake handoff, redaction, and `panelRepo` routing so the
    proof phase only adds the acceptance anchor and release/handoff framing.
  - impl: add a concise `PANELPROOF` pointer in `README.md` and
    `docs/embedder-contract.md` that identifies the acceptance-proof packet as
    the source of truth for version, environment, rollback, and downstream
    adoption status.
  - impl: restate the proof-artifact redaction boundary in those docs so future
    evidence capture cannot treat API keys, GitHub tokens, full transcripts,
    raw screenshot payloads, or secret env values as acceptable release notes.
  - impl: keep this lane bounded to doc anchors and safety language; do not
    widen it into new routing behavior, Portal product copy, or Governed
    Pipeline implementation details.
  - verify: `rg -n "PANELPROOF|acceptance proof|redact|rollback|next adoption step|pipeline intake" README.md docs/embedder-contract.md`

### SL-1 - Backend acceptance proof fixture

- **Scope**: Turn the existing process-route regression matrix into an explicit
  acceptance-proof fixture for the Panel-owned handoff artifact.
- **Owned files**: `apps/backend/__tests__/api/process.test.ts`
- **Interfaces provided**: IF-0-PANELPROOF-1, IF-0-PANELPROOF-2,
  `PANELPROOF-backend-acceptance-evidence`
- **Interfaces consumed**: `PANELROUTE-process-sse-contract`,
  `PANELROUTE-issue-persistence-contract`, `PanelIssueTechnicalDetails`,
  `PANEL_PIPELINE_ISSUE_BODY_SECTIONS`, `PANEL_PIPELINE_MARKER_KEYS`
- **Parallel-safe**: yes
- **Tasks**:
  - test: inventory the current candidate, deferred, replay, and `panelRepo`
    process cases so the acceptance scenario reuses the existing mocks and only
    tightens the assertions needed for `PANELPROOF`.
  - impl: add or rename one focused acceptance test that proves a controlled
    submission produces the frozen issue body sections, candidate labels,
    tracking markers, bounded forwardable metadata, persisted handoff record,
    and replay-safe completion surface.
  - impl: add an explicit deferred-path assertion that documents the exact
    fallback when the issue should stay a GitHub issue but cannot yet claim
    governed-pipeline candidacy.
  - impl: keep this lane test-owned. If proof requires a route-surface change,
    route that work back upstream to `PANELROUTE` instead of silently widening
    `PANELPROOF`.
  - verify: `pnpm --filter @consiliency/panel-backend exec vitest run __tests__/api/process.test.ts`
  - verify: `pnpm --filter @consiliency/panel-backend exec tsc -p tsconfig.json --noEmit`

### SL-2 - SDK acceptance proof fixture

- **Scope**: Prove that the SDK consumes the proof-worthy SSE sequence without
  regressing submission semantics or hiding the handoff event.
- **Owned files**: `packages/core/src/__tests__/client.test.ts`
- **Interfaces provided**: IF-0-PANELPROOF-3,
  `PANELPROOF-sdk-acceptance-evidence`
- **Interfaces consumed**: updated `ProcessEvent`,
  `PANELROUTE-process-sse-contract`, `PanelPipelineHandoff`
- **Parallel-safe**: yes
- **Tasks**:
  - test: audit the current `streamProcess()` coverage and keep the proof case
    grounded in the existing SSE helper rather than inventing a separate mock
    transport.
  - impl: add or rename one acceptance-oriented SDK test that asserts the
    proof-critical event sequence `routing -> pipeline_handoff -> completed`
    and preserves `repo` plus `panelRepo` POST body behavior.
  - impl: keep this lane SDK-test-only; no React feature work or new UX surface
    belongs in `PANELPROOF`.
  - verify: `pnpm --filter @consiliency/panel-core exec vitest run src/__tests__/client.test.ts`
  - verify: `pnpm --filter @consiliency/panel-core build`

### SL-3 - Cross-repo proof packet and deferral mapping

- **Scope**: Write the release/handoff packet that maps Panel-owned evidence to
  the exact Portal and Governed Pipeline contracts that must consume it.
- **Owned files**: `docs/panelproof-acceptance.md`
- **Interfaces provided**: IF-0-PANELPROOF-4,
  `PANELPROOF-portal-linkage-contract`,
  `PANELPROOF-governed-pipeline-consume-or-defer-note`,
  `PANELPROOF-release-rollback-handoff`
- **Interfaces consumed**: `PANELPROOF-docs-redaction-boundary`,
  `PANELPROOF-backend-acceptance-evidence`,
  `PANELPROOF-sdk-acceptance-evidence`, Portal `IF-0-PFOOT-1`, Portal
  `IF-0-PILOT-1`, Governed Pipeline `IF-0-GPACCEPT-1`
- **Parallel-safe**: no
- **Tasks**:
  - test: review `../consiliency-portal/specs/phase-plans-v8.md` and
    `../governed-pipeline/specs/phase-plans-v3.md` to confirm the exact
    downstream readiness language `PANELPROOF` must satisfy or defer.
  - impl: create a proof packet that records the execution environment, repo
    version/commit, proof commands, expected issue artifact shape, and the
    exact evidence fields Portal should use to identify or link the issue as a
    governed-pipeline intake candidate.
  - impl: document the Governed Pipeline side honestly: either name the exact
    issue/metadata consumption surface that already accepts the Panel artifact,
    or record a precise deferral pointing to the missing `GPACCEPT`/Portal
    contract rather than using generic future-work wording.
  - impl: include rollback and next-adoption guidance scoped to Panel-owned
    changes only, not broad multi-repo rollout instructions.
  - impl: keep all evidence redacted and bounded to safe excerpts, links, and
    marker/label metadata.
  - verify: `rg -n "PFOOT|PILOT|PANELPROOF|GPACCEPT|defer|rollback|next adoption step" docs/panelproof-acceptance.md ../consiliency-portal/specs/phase-plans-v8.md ../governed-pipeline/specs/phase-plans-v3.md`

### SL-4 - Acceptance and release-handoff reducer

- **Scope**: Reduce the local proof fixtures and the cross-repo handoff packet
  into the final `PANELPROOF` closeout decision without widening into rollout or
  sister-repo implementation.
- **Owned files**: `none`
- **Interfaces provided**: `PANELPROOF-acceptance-result`
- **Interfaces consumed**: IF-0-PANELPROOF-1, IF-0-PANELPROOF-2,
  IF-0-PANELPROOF-3, IF-0-PANELPROOF-4, IF-0-PANELPROOF-5,
  `PANELPROOF-backend-acceptance-evidence`,
  `PANELPROOF-sdk-acceptance-evidence`,
  `PANELPROOF-release-rollback-handoff`
- **Parallel-safe**: no
- **Tasks**:
  - test: review every roadmap exit criterion against the backend proof test,
    SDK proof test, and cross-repo handoff packet before marking the phase
    complete.
  - test: confirm the phase stays bounded away from production rollout, new
    feedback modes, Portal implementation work, Governed Pipeline issue-ingest
    code changes, and Message Board callback adoption.
  - test: if downstream consumption is still deferred, confirm the deferral
    names one exact missing contract or owner phase instead of a vague
    dependency statement.
  - impl: no additional repo writes; this reducer exists so closeout depends on
    explicit synthesized review rather than prose ordering.
  - verify: `git diff --name-only -- README.md docs/embedder-contract.md docs/panelproof-acceptance.md apps/backend/__tests__/api/process.test.ts packages/core/src/__tests__/client.test.ts`
  - verify: `git diff --check -- README.md docs/embedder-contract.md docs/panelproof-acceptance.md apps/backend/__tests__/api/process.test.ts packages/core/src/__tests__/client.test.ts`

## Verification

Planning wrote the artifact only; verification was not run. During execution,
do not start this phase until the downstream acceptance prerequisites are ready
locally: `../consiliency-portal` must freeze `IF-0-PFOOT-1`, and
`../governed-pipeline` must freeze `IF-0-GPACCEPT-1`. Portal `PILOT` is a
downstream consumer of this proof or a documented deferral, not a prerequisite.
Once those downstream gates are clear, run the focused proof checks and then
confirm the cross-repo handoff language:

```bash
pnpm --filter @consiliency/panel-backend exec vitest run __tests__/api/process.test.ts
pnpm --filter @consiliency/panel-backend exec tsc -p tsconfig.json --noEmit
pnpm --filter @consiliency/panel-core exec vitest run src/__tests__/client.test.ts
pnpm --filter @consiliency/panel-core build
rg -n "PANELPROOF|acceptance proof|redact|rollback|next adoption step|pipeline intake" README.md docs/embedder-contract.md docs/panelproof-acceptance.md
rg -n "PFOOT|PILOT|PANELPROOF|GPACCEPT|defer|rollback|next adoption step" docs/panelproof-acceptance.md ../consiliency-portal/specs/phase-plans-v8.md ../governed-pipeline/specs/phase-plans-v3.md
git diff --check -- README.md docs/embedder-contract.md docs/panelproof-acceptance.md apps/backend/__tests__/api/process.test.ts packages/core/src/__tests__/client.test.ts
git status --short -- specs/phase-plans-v1.md plans/phase-plan-v1-PANELPROOF.md README.md docs/embedder-contract.md docs/panelproof-acceptance.md apps/backend/__tests__/api/process.test.ts packages/core/src/__tests__/client.test.ts
```

## Acceptance Criteria

- [ ] A controlled test submission proves the exact Panel-owned issue artifact:
  frozen issue sections, candidate/deferred labels, tracking markers, bounded
  handoff metadata, and replay-safe completion behavior.
- [ ] Backend acceptance coverage names the candidate and deferred proof paths
  without leaking API keys, GitHub tokens, full transcripts, raw screenshot
  payloads, or secret env values.
- [ ] SDK acceptance coverage proves that `streamProcess()` forwards the
  proof-critical SSE sequence without regressing `repo` / `panelRepo`
  semantics.
- [ ] `docs/panelproof-acceptance.md` records version, environment, proof
  commands, Portal linkage expectation, Governed Pipeline consume-or-defer
  status, rollback, and next adoption step.
- [ ] README and `docs/embedder-contract.md` point to the proof packet and
  restate the redaction boundary for acceptance artifacts.
- [ ] If downstream intake is not yet fully consumable, the phase documents the
  exact missing Portal or Governed Pipeline contract instead of implying a
  seamless integration that does not exist.
- [ ] The phase stays bounded to proof, evidence, and handoff documentation; it
  does not widen into production rollout, new feedback modes, or sister-repo
  implementation work.

## Suggested Next Commands

Next phase: `PANELPROOF` - execution ready. Local `../consiliency-portal` has
frozen `IF-0-PFOOT-1`, and local `../governed-pipeline` has frozen
`IF-0-GPACCEPT-1`. Portal `PILOT` should consume the resulting
`IF-0-PANELPROOF-1` evidence or an explicit deferral after this phase closes.

Next command:

```bash
codex-execute-phase plans/phase-plan-v1-PANELPROOF.md
```

```yaml
automation:
  status: planned
  next_skill: codex-execute-phase
  next_command: codex-execute-phase plans/phase-plan-v1-PANELPROOF.md
  next_model_hint: execute
  next_effort_hint: medium
  human_required: false
  blocker_class: none
  blocker_summary: none
  required_human_inputs: []
  verification_status: not_run
  artifact: /home/viperjuice/code/consiliency-panel/plans/phase-plan-v1-PANELPROOF.md
  artifact_state: staged
```
