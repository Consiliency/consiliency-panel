---
phase_loop_plan_version: 1
phase: PANELINTAKE
roadmap: specs/phase-plans-v1.md
roadmap_sha256: cf672eb20092894bc58b47cb2023cad63469daf770736a50550324ec36c3b93a
---

# PANELINTAKE: Feedback-To-Pipeline Intake Contract

## Context

Roadmap source: `specs/phase-plans-v1.md`, Phase 1 (`PANELINTAKE`). Canonical
`.phase-loop/state.json` marks `PANELINTAKE` as `unplanned`, with a clean
`main` worktree at `6af0bcd0d15bc2db563fea1fbfa018be56517de5` and the same
roadmap hash recorded by the runner state.

This phase is contract-first and bounded. The repo already has the panel issue
pipeline, `panelRepo` routing, routing SSE events, screenshot-kind hints, and
embedder documentation in place. `PANELINTAKE` should freeze the future
feedback-to-pipeline intake surface without changing backend route behavior,
Portal code, Governed Pipeline code, or Message Board callbacks.

Sibling roadmap context matters here. Governed Pipeline Phase 1 (`GPINJ0`)
freezes the installer and lifecycle vocabulary that Panel should reference as
downstream intake hints, while Portal Phase 1 (`PINJ0`) keeps Panel hooks
optional until this repo's intake contract is frozen. Execution should therefore
focus on shared types plus docs that later `PANELROUTE` work can implement
against directly.

## Interface Freeze Gates

- [ ] IF-0-PANELINTAKE-1 — `packages/types/src/panel.ts` exports a frozen
  intake-routing vocabulary with exact literals
  `host_app`, `panel_widget`, and `pipeline_intake`, plus a typed contract for
  GitHub labels, issue body sections, tracking-marker keys, forwardable
  metadata, linked evidence, and explicit-approval requirements.
- [ ] IF-0-PANELINTAKE-2 — The GitHub issue handoff contract freezes the exact
  body section headings `## Summary`, `## User-approved details`,
  `## Environment`, `## Routing`, `## Pipeline intake handoff`, and
  `## Linked evidence`, and documents the label families for source, routing
  target, and intake-candidate classification.
- [ ] IF-0-PANELINTAKE-3 — Tracking-marker keys are frozen exactly as
  `panel_source`, `panel_submission_id`, `panel_product_key`, `panel_target`,
  `panel_repo_decision`, `panel_intake_candidate`, `panel_screenshot_kinds`,
  `panel_summary_ref`, and `panel_pipeline_hint`.
- [ ] IF-0-PANELINTAKE-4 — Metadata safety rules freeze which fields may travel
  downstream as structured intake metadata: page URL, page title, submission
  timestamp, GitHub login, selected model ID, component hint, screenshot kinds,
  and bounded navigation/context summaries; raw transcript dumps, raw console
  logs, full screenshot payloads, and secret-bearing values remain linked,
  summarized, or excluded.
- [ ] IF-0-PANELINTAKE-5 — Docs freeze the explicit user-approval and redaction
  posture for every external write and name the downstream dependency boundary:
  Panel emits GitHub issue metadata and linked evidence only, Governed Pipeline
  consumes the intake hint later, Portal owns embedder credentials and intake
  visibility, and Message Board callbacks remain out of scope for this phase.

## Lane Index & Dependencies

- SL-0 — Shared intake type contract; Depends on: (none); Blocks: SL-1, SL-2;
  Parallel-safe: no
- SL-1 — Embedder intake and safety contract; Depends on: SL-0; Blocks: SL-3;
  Parallel-safe: yes
- SL-2 — Cross-repo dependency and operator handoff docs; Depends on: SL-0;
  Blocks: SL-3; Parallel-safe: yes
- SL-3 — Acceptance reducer; Depends on: SL-1, SL-2; Blocks: (none);
  Parallel-safe: no

## Lanes

### SL-0 — Shared intake type contract

- **Scope**: Add the frozen intake contract vocabulary to the shared types
  package so later backend and SDK work can reuse one exact surface.
- **Owned files**: `packages/types/src/panel.ts`
- **Interfaces provided**: IF-0-PANELINTAKE-1, IF-0-PANELINTAKE-3,
  `PanelPipelineIntakeContract`, `PanelPipelineMarkerKey`,
  `PanelPipelineForwardableMetadata`, `PanelPipelineLinkedEvidencePolicy`
- **Interfaces consumed**: pre-existing `SubmissionPayload`, `NextTurnRequest`,
  `ProcessEvent`, `AttachmentRef`, and routing terminology from
  `apps/backend/app/v1/panel/process/[id]/route.ts`,
  `apps/backend/__tests__/api/process.test.ts`, and Governed Pipeline
  `IF-0-GPINJ0-1`
- **Parallel-safe**: no
- **Tasks**:
  - test: inventory the existing routing and process-event surface so the new
    typed intake contract extends, rather than duplicates or contradicts, the
    current panel submission vocabulary.
  - impl: add exported type aliases and interfaces for intake target kind,
    issue label families, body section keys, marker keys, forwardable metadata,
    linked evidence policy, and approval requirements.
  - impl: keep this lane contract-only; do not thread the new types through
    runtime callers yet.
  - verify: `pnpm --filter @consiliency/panel-types build`
  - verify: `pnpm --filter @consiliency/panel-core build`
  - verify: `pnpm --filter @consiliency/panel-react build`
  - verify: `pnpm --filter @consiliency/panel-backend exec tsc -p apps/backend/tsconfig.json --noEmit`

### SL-1 — Embedder intake and safety contract

- **Scope**: Freeze the GitHub issue handoff, metadata budget, redaction rules,
  and user-approval requirements in the embedder contract doc.
- **Owned files**: `docs/embedder-contract.md`
- **Interfaces provided**: IF-0-PANELINTAKE-2, IF-0-PANELINTAKE-4,
  IF-0-PANELINTAKE-5, `PANELINTAKE-body-section-contract`,
  `PANELINTAKE-metadata-budget-contract`
- **Interfaces consumed**: `PanelPipelineIntakeContract`,
  `PanelPipelineMarkerKey`, `PanelPipelineForwardableMetadata`,
  `PanelPipelineLinkedEvidencePolicy`
- **Parallel-safe**: yes
- **Tasks**:
  - test: audit the current embedder contract for where routing, screenshot
    signals, explicit approval, and CORS/auth guidance already exist so the new
    intake section does not fork those rules.
  - impl: add a dedicated intake-contract section that freezes the exact GitHub
    issue section headings, label families, marker keys, and the distinction
    between host-app, panel-widget, and pipeline-intake routing.
  - impl: document the structured metadata budget and explicitly state which
    transcript, console, and screenshot data stay linked or summarized instead
    of being forwarded inline.
  - impl: state that every downstream write still requires explicit user
    approval and that redaction applies before any issue body or intake hint is
    emitted.
  - verify: `rg -n "Pipeline intake handoff|User-approved details|Linked evidence|panel_submission_id|panel_pipeline_hint|explicit user approval|redaction" docs/embedder-contract.md`

### SL-2 — Cross-repo dependency and operator handoff docs

- **Scope**: Align the top-level README with the frozen intake contract and the
  sister-repo dependency boundaries that govern later implementation.
- **Owned files**: `README.md`
- **Interfaces provided**: `PANELINTAKE-cross-repo-dependency-note`,
  `PANELINTAKE-operator-handoff-note`
- **Interfaces consumed**: `PanelPipelineIntakeContract`,
  `PANELINTAKE-body-section-contract`, Governed Pipeline `IF-0-GPINJ0-1`,
  Portal `IF-0-PINJ0-1`
- **Parallel-safe**: yes
- **Tasks**:
  - test: audit the existing README sections on issue creation, admin setup,
    embedder contract, and repo routing for the minimal place to describe the
    new intake contract without widening into implementation details.
  - impl: add concise README guidance that Panel can emit a bounded
    feedback-to-pipeline intake hint through GitHub issues, but Portal and
    Governed Pipeline remain the downstream consumers and orchestrators.
  - impl: name the required downstream contracts (`GPINJ0`, Portal `PINJ0`,
    later `PANELROUTE`) and keep Message Board callbacks explicitly deferred.
  - impl: point readers back to `docs/embedder-contract.md` for the frozen
    contract details instead of duplicating the entire policy.
  - verify: `rg -n "feedback-to-pipeline|Governed Pipeline|Portal|PANELROUTE|GPINJ0|PINJ0" README.md`

### SL-3 — Acceptance reducer

- **Scope**: Reduce the type and doc outputs into a final phase acceptance
  check that stays contract-only and does not drift into route implementation.
- **Owned files**: `none (final reducer lane)`
- **Interfaces provided**: `PANELINTAKE-acceptance-result`
- **Interfaces consumed**: IF-0-PANELINTAKE-1, IF-0-PANELINTAKE-2,
  IF-0-PANELINTAKE-3, IF-0-PANELINTAKE-4, IF-0-PANELINTAKE-5,
  `PANELINTAKE-body-section-contract`,
  `PANELINTAKE-metadata-budget-contract`,
  `PANELINTAKE-cross-repo-dependency-note`
- **Parallel-safe**: no
- **Tasks**:
  - test: review every roadmap exit criterion against the updated shared types
    and docs before considering the phase complete.
  - test: confirm runtime files remain unchanged, especially
    `apps/backend/app/v1/panel/process/[id]/route.ts` and
    `apps/backend/__tests__/api/process.test.ts`.
  - impl: no additional repo writes; this lane exists so acceptance depends on
    explicit synthesized review rather than prose ordering.
  - verify: `git diff --name-only -- README.md docs/embedder-contract.md packages/types/src/panel.ts 'apps/backend/app/v1/panel/process/[id]/route.ts' apps/backend/__tests__/api/process.test.ts`
  - verify: `git diff --check -- README.md docs/embedder-contract.md packages/types/src/panel.ts`

## Verification

Planning wrote the artifact only; verification was not run. During execution,
run the focused contract checks first, then confirm the phase stayed bounded:

```bash
pnpm --filter @consiliency/panel-types build
pnpm --filter @consiliency/panel-core build
pnpm --filter @consiliency/panel-react build
pnpm --filter @consiliency/panel-backend exec tsc -p apps/backend/tsconfig.json --noEmit
rg -n "Pipeline intake handoff|User-approved details|Linked evidence|panel_submission_id|panel_pipeline_hint|explicit user approval|redaction" docs/embedder-contract.md
rg -n "feedback-to-pipeline|Governed Pipeline|Portal|PANELROUTE|GPINJ0|PINJ0" README.md
git diff --name-only -- README.md docs/embedder-contract.md packages/types/src/panel.ts 'apps/backend/app/v1/panel/process/[id]/route.ts' apps/backend/__tests__/api/process.test.ts
git diff --check -- README.md docs/embedder-contract.md packages/types/src/panel.ts
git status --short -- specs/phase-plans-v1.md plans/phase-plan-v1-PANELINTAKE.md README.md docs/embedder-contract.md packages/types/src/panel.ts
```

## Acceptance Criteria

- [ ] `packages/types/src/panel.ts` exports a frozen intake contract that
  distinguishes `host_app`, `panel_widget`, and `pipeline_intake`.
- [ ] The contract freezes GitHub issue body sections, label families, and the
  exact tracking-marker keys listed in IF-0-PANELINTAKE-3.
- [ ] Docs state which structured metadata may be forwarded downstream and
  which transcript, console, and screenshot data must stay linked or
  summarized.
- [ ] Docs preserve the explicit user-approval and redaction posture for all
  external writes.
- [ ] README and embedder docs name Governed Pipeline and Portal dependencies
  without implying Panel is the orchestrator.
- [ ] `PANELINTAKE` does not change backend route behavior, Portal code,
  Governed Pipeline code, or Message Board callback surfaces.
