# Phase roadmap v1

## Context

Consiliency Panel is an embeddable feedback and issue-creation surface. It
already supports a React widget, backend capabilities endpoint, agentic feedback
conversation, repo routing with `panelRepo`, screenshot metadata, and GitHub
issue creation.

The next boundary is coordinated development intake. Panel feedback should be
able to become a Governed Pipeline intake signal visible in Portal without
turning Panel into the pipeline orchestrator.

This roadmap is coordinated with:

- `governed-pipeline/specs/phase-plans-v3.md`
- `consiliency-portal/specs/phase-plans-v8.md`
- `message-board/specs/phase-plans-v3.md`

## Architecture North Star

Consiliency Panel remains a lightweight embeddable feedback product. It captures
user context, conversation, screenshots, console/navigation signals, and explicit
user approval. Portal and Governed Pipeline consume the resulting issue or
handoff metadata as development intake.

## Assumptions

1. Portal remains the API-key administration surface for panel embedders.
2. GitHub issues remain the first durable handoff target.
3. Governed Pipeline can ingest GitHub issues, comments, or structured intake
   markers after its own roadmap phases freeze.
4. Panel must not write to Portal or Message Board without an explicit contract.
5. Public embed keys must be documented as public/scope-limited or moved behind
   a Portal proxy in a later hardening phase.

## Non-Goals

- Running Governed Pipeline from the panel backend.
- Replacing Portal issue triage or pipeline job UI.
- Expanding panel modes beyond feedback unless needed for intake.
- Storing secrets in client-side configuration.
- Building Message Board callback delivery before its v3 contract freezes.

## Cross-Cutting Principles

1. User approval remains required before external writes.
2. Issue and intake metadata are bounded and safe for automation.
3. Routing between host app, panel repo, and pipeline intake is explainable.
4. Portal owns embedder credential lifecycle.
5. Pipeline handoff starts with metadata and links, not full transcript dumps.

## Top Interface-Freeze Gates

- IF-0-PANELINTAKE-1 - Feedback-to-pipeline intake metadata, labels, tracking markers, and GitHub issue handoff contract are frozen.
- IF-0-PANELAUTH-1 - Portal-managed embedder credential, public-key posture, CORS, and environment contract are frozen.
- IF-0-PANELROUTE-1 - Panel backend routing and process events expose pipeline-intake handoff metadata without taking orchestration ownership.
- IF-0-PANELPROOF-1 - Portal and Governed Pipeline acceptance proof for feedback-to-pipeline intake is frozen.

## Phases

### Phase 1 - Feedback-To-Pipeline Intake Contract (PANELINTAKE)

**Objective**

Freeze the metadata and routing contract that lets panel feedback become a
Governed Pipeline intake signal through GitHub and Portal.

**Exit criteria**

- [ ] Contract defines issue labels, body sections, tracking markers, source metadata, screenshot references, and pipeline-intake hints.
- [ ] Contract distinguishes host-app issues, panel-widget issues, and pipeline-roadmap intake.
- [ ] Contract records which metadata can be passed to Governed Pipeline and which transcript/screenshot data stays linked or summarized.
- [ ] Contract names Portal and Governed Pipeline dependencies without adding implementation code.
- [ ] Docs include redaction and user-approval rules.

**Scope notes**

- Lane 1: GitHub issue and marker contract.
- Lane 2: Metadata safety and transcript/screenshot budget.
- Lane 3: Cross-repo dependency notes.

**Non-goals**

- Backend route changes.
- Portal API key changes.
- Message Board callbacks.

**Key files**

- `specs/phase-plans-v1.md`
- `README.md`
- `docs/embedder-contract.md`
- `packages/types/src/panel.ts`

**Depends on**

- Governed Pipeline `IF-0-GPINJ0-1`

**Produces**

- IF-0-PANELINTAKE-1 - Feedback-to-pipeline intake metadata, labels, tracking markers, and GitHub issue handoff contract are frozen.

### Phase 2 - Portal-Managed Embedder Credential Posture (PANELAUTH)

**Objective**

Clarify and harden the relationship between Portal-issued panel API keys, public
embed configuration, CORS, and backend authorization.

**Exit criteria**

- [ ] Docs state whether `NEXT_PUBLIC_PANEL_API_KEY` is intentionally public and scope-limited or must move behind a Portal proxy.
- [ ] Backend and embedder docs align on allowed origins, product keys, user tier resolution, and rotation responsibilities.
- [ ] Portal-owned admin actions needed for key issue/rotation are listed for the Portal roadmap agent.
- [ ] Tests cover capability failures for missing, expired, disabled, or wrong-origin keys.
- [ ] No secret values are printed in tests or docs.

**Scope notes**

- Lane 1: Credential posture docs and API-key contract.
- Lane 2: Backend capabilities/auth regression tests.
- Lane 3: Portal dependency handoff.

**Non-goals**

- Implementing Portal proxy unless the phase plan chooses it as the minimal fix.
- Changing GitHub issue routing.
- Adding new model providers.

**Key files**

- `README.md`
- `docs/embedder-contract.md`
- `apps/backend/app/v1/panel/capabilities/route.ts`
- `apps/backend/lib/auth.ts`
- `apps/backend/__tests__/api/capabilities.test.ts`

**Depends on**

- IF-0-PANELINTAKE-1
- Portal `IF-0-PINJ0-1`

**Produces**

- IF-0-PANELAUTH-1 - Portal-managed embedder credential, public-key posture, CORS, and environment contract are frozen.

### Phase 3 - Process Events And Pipeline Handoff Metadata (PANELROUTE)

**Objective**

Extend panel processing so GitHub issue creation emits structured, bounded
handoff metadata that Portal and Governed Pipeline can use for intake.

**Exit criteria**

- [ ] Process SSE includes a pipeline-intake handoff event when the issue should enter governed development.
- [ ] Created GitHub issues include frozen labels/markers from `PANELINTAKE`.
- [ ] Routing preserves `panelRepo` behavior and explains host-vs-panel-vs-pipeline decisions.
- [ ] Backend tests cover handoff event emission, marker formatting, fallback behavior, and user-approved writes.
- [ ] No pipeline orchestration is run from the panel backend.

**Scope notes**

- Lane 1: Process route handoff event.
- Lane 2: GitHub issue formatting and marker injection.
- Lane 3: Tests for routing, failure, and fallback behavior.

**Non-goals**

- Portal ingestion implementation.
- Governed Pipeline issue ingestion changes.
- Message Board callbacks.

**Key files**

- `apps/backend/app/v1/panel/process/[id]/route.ts`
- `apps/backend/__tests__/api/process.test.ts`
- `packages/types/src/panel.ts`
- `packages/core/src/client.ts`
- `packages/react/src/chat/PanelChat.tsx`

**Depends on**

- IF-0-PANELAUTH-1
- Governed Pipeline `IF-0-GPSTATE-1`

**Produces**

- IF-0-PANELROUTE-1 - Panel backend routing and process events expose pipeline-intake handoff metadata without taking orchestration ownership.

### Phase 4 - Feedback-To-Pipeline Acceptance Proof (PANELPROOF)

**Objective**

Prove the panel-to-pipeline intake loop with Portal and Governed Pipeline before
claiming the integration is seamless.

**Exit criteria**

- [ ] A test submission creates a GitHub issue with the frozen pipeline-intake metadata.
- [ ] Portal can identify or link the created issue as a governed-pipeline intake candidate.
- [ ] Governed Pipeline roadmap/issue intake can consume the issue or the deferral is documented with exact missing contract.
- [ ] Evidence redacts API keys, GitHub tokens, transcripts beyond safe excerpts, and secret environment values.
- [ ] Release/handoff docs state version, environment, rollback, and next adoption step.

**Scope notes**

- Lane 1: Backend and SDK acceptance smoke.
- Lane 2: Portal/Governed Pipeline handoff evidence.
- Lane 3: Release and rollback docs.

**Non-goals**

- Broad production rollout.
- New feedback modes.
- Agent-board callback adoption unless Message Board `MBPROOF` is already closed.

**Key files**

- `docs/embedder-contract.md`
- `README.md`
- `apps/backend/__tests__/api/process.test.ts`
- `packages/core/src/__tests__/client.test.ts`

**Depends on**

- IF-0-PANELROUTE-1
- Portal `IF-0-PFOOT-1`
- Governed Pipeline `IF-0-GPACCEPT-1`

**Produces**

- IF-0-PANELPROOF-1 - Portal and Governed Pipeline acceptance proof for feedback-to-pipeline intake is frozen.

## Phase Dependency DAG

```text
governed-pipeline: GPINJ0
  -> consiliency-panel: PANELINTAKE
     -> consiliency-panel: PANELAUTH
        -> consiliency-panel: PANELROUTE
           -> consiliency-panel: PANELPROOF

external consumers:
  PANELINTAKE -> portal PINJ0/PILOT planning context
  PANELPROOF -> portal PILOT optional integration proof
```

## Execution Notes

- Plan `PANELINTAKE` after Governed Pipeline `GPINJ0` so tracking markers and
  intake vocabulary are stable.
- `PANELAUTH` should coordinate with Portal `PINJ0` because Portal owns API-key
  administration.
- `PANELROUTE` can execute independently after the first two contracts freeze.
- `PANELPROOF` waits for Portal and Governed Pipeline acceptance readiness.

## Verification

```bash
# Planning-only roadmap verification
rg -n "IF-0-PANELINTAKE|IF-0-PANELAUTH|IF-0-PANELROUTE|IF-0-PANELPROOF" specs/phase-plans-v1.md

# Phase-specific verification to be run by downstream phase plans
pnpm build
pnpm test
pnpm --filter @consiliency/panel-backend test
pnpm --filter @consiliency/panel-core test
```

## Suggested Next Commands

Next phase: `PANELINTAKE` - Feedback-To-Pipeline Intake Contract

Next command:

```bash
codex-plan-phase specs/phase-plans-v1.md PANELINTAKE
```

```yaml
automation:
  status: unplanned
  next_skill: codex-plan-phase
  next_command: codex-plan-phase specs/phase-plans-v1.md PANELINTAKE
  next_model_hint: plan
  next_effort_hint: high
  human_required: false
  blocker_class: none
  blocker_summary: none
  required_human_inputs: []
  verification_status: not_run
  artifact: /home/viperjuice/code/consiliency-panel/specs/phase-plans-v1.md
  artifact_state: tracked
```
