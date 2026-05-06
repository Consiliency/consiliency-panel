---
phase_loop_plan_version: 1
phase: PANELROUTE
roadmap: specs/phase-plans-v1.md
roadmap_sha256: cf672eb20092894bc58b47cb2023cad63469daf770736a50550324ec36c3b93a
---

# PANELROUTE: Process Events And Pipeline Handoff Metadata

## Context

Roadmap source: `specs/phase-plans-v1.md`, Phase 3 (`PANELROUTE`). The
selected roadmap hash matches the canonical `.phase-loop/state.json` value
`cf672eb20092894bc58b47cb2023cad63469daf770736a50550324ec36c3b93a`.

Canonical runner state still lists `PANELAUTH` as the current unplanned phase,
but the repo already contains `plans/phase-plan-v1-PANELAUTH.md`. This
`PANELROUTE` artifact is therefore an explicit downstream planning write, not a
claim that upstream execution has already completed. Execution must still honor
the roadmap dependencies on `IF-0-PANELAUTH-1` and Governed Pipeline
`IF-0-GPSTATE-1`.

The current backend already does the first half of this phase: it validates the
panel API key, reads the stored submission, optionally calls `RouteToRepo` when
`panelRepo` is present, emits a `routing` SSE event, formats an issue through
`FormatAsGitHubIssue`, creates the GitHub issue, stores `plain_summary`,
`technical_details`, and `labels` in `panel_issues`, and ends with a
`completed` SSE event. The remaining gap is that the runtime surface still has
no bounded pipeline-handoff payload. `ProcessEvent` only models
`progress | routing | completed | error`, the formatter still emits the older
generic GitHub issue template rather than the frozen `PANELINTAKE` sections,
and the UI/client layers currently ignore everything except progress,
completion, and failure.

`PANELROUTE` should extend that existing route instead of widening into Portal
ingestion or Governed Pipeline orchestration. The backend remains responsible
for one GitHub issue in either the host repo or `panelRepo`; pipeline intake is
an additional handoff classification layered on top of that repo decision, not
a third repository destination.

## Interface Freeze Gates

- [ ] IF-0-PANELROUTE-1 - `packages/types/src/panel.ts` freezes a bounded
  runtime handoff contract that separates GitHub repo routing from downstream
  intake classification: repo decision stays `app | panel`, maps to frozen
  `host_app | panel_widget`, and pipeline intake is represented separately as a
  candidate or deferred handoff rather than a repo switch.
- [ ] IF-0-PANELROUTE-2 - `ProcessEvent` grows an exact
  `pipeline_handoff` event shape with typed fields for repo decision,
  target repo, issue labels, tracking markers, forwardable intake metadata, and
  candidate/deferred status; no raw transcript, raw console log block, or raw
  screenshot payload appears in the SSE payload.
- [ ] IF-0-PANELROUTE-3 - `FormatAsGitHubIssue` and its generated client/schema
  surface produce the frozen `PANELINTAKE` GitHub sections `## Summary`,
  `## User-approved details`, `## Environment`, `## Routing`,
  `## Pipeline intake handoff`, and `## Linked evidence`, plus structured label
  and marker data that the backend can apply without string re-parsing.
- [ ] IF-0-PANELROUTE-4 - `apps/backend/app/v1/panel/process/[id]/route.ts`
  preserves existing `panelRepo` behavior, emits `routing` first and
  `pipeline_handoff` only when the issue is a governed-development intake
  candidate, persists the bounded handoff summary alongside the created issue,
  and never calls Governed Pipeline or Portal APIs directly.
- [ ] IF-0-PANELROUTE-5 - Regression coverage proves candidate emission,
  deferred fallback, replay behavior for already-completed submissions, frozen
  label/marker formatting, and explicit-user-approved write boundaries without
  leaking secrets or widening into downstream orchestration.

## Lane Index & Dependencies

- SL-0 - Shared handoff event contract; Depends on: (none); Blocks: SL-1,
  SL-2, SL-3, SL-4; Parallel-safe: no
- SL-1 - Formatter and generated BAML output; Depends on: SL-0; Blocks: SL-2,
  SL-4; Parallel-safe: no
- SL-2 - Backend process route and issue persistence; Depends on: SL-0, SL-1;
  Blocks: SL-3, SL-4, SL-5; Parallel-safe: no
- SL-3 - SDK and React event-consumer alignment; Depends on: SL-0, SL-2;
  Blocks: SL-5; Parallel-safe: yes
- SL-4 - Backend process regression matrix; Depends on: SL-0, SL-1, SL-2;
  Blocks: SL-5; Parallel-safe: yes
- SL-5 - Acceptance and docs-bounds reducer; Depends on: SL-3, SL-4; Blocks:
  (none); Parallel-safe: no

## Lanes

### SL-0 - Shared handoff event contract

- **Scope**: Freeze the typed runtime contract for repo-routing decisions,
  pipeline-handoff metadata, and persisted issue details before changing the
  route or formatter.
- **Owned files**: `packages/types/src/panel.ts`, `packages/types/src/database.ts`
- **Interfaces provided**: IF-0-PANELROUTE-1, IF-0-PANELROUTE-2,
  `PanelRepoDecision`, `PanelPipelineHandoff`, `PanelPipelineHandoffEvent`,
  `PanelIssueTechnicalDetails`
- **Interfaces consumed**: pre-existing `PANEL_PIPELINE_INTAKE_CONTRACT`,
  `PANEL_PIPELINE_MARKER_KEYS`, `PANEL_PIPELINE_FORWARDABLE_METADATA_KEYS`,
  `ProcessEvent`, and `PanelIssue`
- **Parallel-safe**: no
- **Tasks**:
  - test: inventory the current `ProcessEvent` shape, `panel_issues`
    persistence contract, and `PANELINTAKE` constants so the new runtime types
    extend the frozen contract instead of re-declaring it in route-local code.
  - impl: add explicit shared types for repo decision, handoff status
    (`candidate` or `deferred`), bounded marker/value maps, forwardable intake
    metadata, and the persisted `technical_details` JSON shape used by the
    process route.
  - impl: keep pipeline intake distinct from repo choice: the GitHub issue
    still lands in the host repo or `panelRepo`, while governed-pipeline
    candidacy is represented as metadata on that issue.
  - verify: `pnpm --filter @consiliency/panel-types build`
  - verify: `pnpm --filter @consiliency/panel-core build`
  - verify: `pnpm --filter @consiliency/panel-react build`
  - verify: `pnpm --filter @consiliency/panel-backend exec tsc -p tsconfig.json --noEmit`

### SL-1 - Formatter and generated BAML output

- **Scope**: Make the formatter emit the frozen intake sections and structured
  handoff payload so the backend does not have to scrape markdown back into
  labels or markers.
- **Owned files**: `baml_src/format.baml`, `baml_src/types.baml`, `baml_client/**`
- **Interfaces provided**: IF-0-PANELROUTE-3, `IssueOutput.pipeline_handoff`,
  `IssueOutput.issue_markers`, `IssueOutput.issue_sections`
- **Interfaces consumed**: `PanelPipelineHandoff`,
  `PANEL_PIPELINE_ISSUE_BODY_SECTIONS`, `PANEL_PIPELINE_MARKER_KEYS`,
  `PanelRepoDecision`, pre-existing `IssueInput`, `IssueClassification`,
  `RepoEnrichment`, and optional `FixSuggestion`
- **Parallel-safe**: no
- **Tasks**:
  - test: audit the current formatter prompt and generated `IssueOutput` schema
    for every place it still assumes the older `## Description` style issue
    template or returns only free-form labels/body text.
  - impl: extend the BAML output schema to return structured pipeline-handoff
    data, routing/body sections aligned to `PANELINTAKE`, and the label/marker
    values the route should apply verbatim.
  - impl: keep the formatter bounded to GitHub issue creation artifacts; it
    must not emit Portal API calls, Governed Pipeline commands, or raw
    transcript dumps.
  - impl: regenerate `baml_client/**` from the updated schema so the backend
    route can consume typed formatter output.
  - verify: `pnpm exec baml-cli generate`
  - verify: `pnpm --filter @consiliency/panel-backend exec tsc -p tsconfig.json --noEmit`

### SL-2 - Backend process route and issue persistence

- **Scope**: Thread the shared handoff contract through the process route while
  preserving idempotency, repo routing, and bounded GitHub issue creation.
- **Owned files**: `apps/backend/app/v1/panel/process/[id]/route.ts`
- **Interfaces provided**: IF-0-PANELROUTE-4,
  `PANELROUTE-process-sse-contract`, `PANELROUTE-issue-persistence-contract`
- **Interfaces consumed**: `PanelPipelineHandoffEvent`,
  `PanelIssueTechnicalDetails`, `IssueOutput.pipeline_handoff`,
  `IssueOutput.issue_markers`, `IssueOutput.issue_sections`,
  `PANEL_PIPELINE_INTAKE_CONTRACT`, `RouteToRepo`, and pre-existing submission
  idempotency behavior
- **Parallel-safe**: no
- **Tasks**:
  - test: audit the live route flow for where routing, formatting, replay, and
    `panel_issues` persistence currently happen so handoff emission is added in
    one place rather than spread across ad hoc helpers.
  - impl: preserve the existing repo-selection rule: `RouteToRepo` decides only
    between app repo and `panelRepo`, then the route maps that choice to the
    frozen routing vocabulary and adds pipeline-intake candidacy as a separate
    downstream hint.
  - impl: emit `routing` before issue creation and emit `pipeline_handoff`
    only when the bounded formatter output marks the issue as governed-intake
    candidate; candidate replay for already-completed submissions should come
    from persisted metadata instead of re-running the pipeline.
  - impl: inject the frozen labels, marker lines, and issue-body sections into
    the GitHub create payload, and persist the bounded handoff summary inside
    the existing `technical_details` JSON so replay and comment flows can read
    one stable record.
  - impl: keep fallback behavior explicit: if the formatter can create the
    issue body but cannot prove intake candidacy, file the issue with deferred
    handoff metadata instead of failing the whole route or invoking downstream
    orchestration.
  - impl: do not call Portal APIs, Governed Pipeline APIs, Message Board, or
    any external orchestrator from this route.
  - verify: `pnpm --filter @consiliency/panel-backend exec vitest run __tests__/api/process.test.ts`
  - verify: `pnpm --filter @consiliency/panel-backend exec tsc -p tsconfig.json --noEmit`

### SL-3 - SDK and React event-consumer alignment

- **Scope**: Keep the client and React layers compatible with the new SSE event
  without regressing current submit and completion behavior.
- **Owned files**: `packages/core/src/client.ts`, `packages/core/src/__tests__/client.test.ts`, `packages/react/src/chat/PanelChat.tsx`, `packages/react/src/chat/SubmitButton.tsx`
- **Interfaces provided**: `PANELROUTE-client-event-compat`,
  `PANELROUTE-react-submit-compat`
- **Interfaces consumed**: `PanelPipelineHandoffEvent`, updated `ProcessEvent`,
  `PANELROUTE-process-sse-contract`
- **Parallel-safe**: yes
- **Tasks**:
  - test: inventory how `streamProcess()` parses SSE lines and how the React
    submit flows currently branch on `progress`, `completed`, and `error`.
  - impl: ensure the core client forwards the new event type unchanged and that
    React submit flows either surface or safely ignore `pipeline_handoff`
    without breaking completion state.
  - impl: preserve existing `panelRepo` request payloads and "issue created"
    behavior; this lane is compatibility work, not a new UX feature phase.
  - verify: `pnpm --filter @consiliency/panel-core exec vitest run src/__tests__/client.test.ts`
  - verify: `pnpm --filter @consiliency/panel-core build`
  - verify: `pnpm --filter @consiliency/panel-react build`

### SL-4 - Backend process regression matrix

- **Scope**: Add focused route tests for the new handoff event, label/marker
  injection, deferred fallback, and replay behavior while keeping the user
  approval boundary intact.
- **Owned files**: `apps/backend/__tests__/api/process.test.ts`
- **Interfaces provided**: IF-0-PANELROUTE-5,
  `PANELROUTE-process-regression-matrix`
- **Interfaces consumed**: `PANELROUTE-process-sse-contract`,
  `PANELROUTE-issue-persistence-contract`, `IssueOutput.pipeline_handoff`,
  `PanelPipelineHandoffEvent`, and pre-existing submit/processing idempotency
- **Parallel-safe**: yes
- **Tasks**:
  - test: extend the route mocks so they can assert exact GitHub labels, body
    content, persisted `technical_details` handoff data, and SSE event order.
  - test: cover the candidate path, deferred path, `panelRepo` present/absent
    routing, and replay for already-completed submissions without re-running
    the formatter or router.
  - test: assert that only user-approved/bounded content appears in the issue
    body and handoff payload; raw transcript dumps, raw console logs, and
    screenshot payloads stay linked, summarized, or excluded per
    `PANELINTAKE`.
  - test: prove that no Portal or Governed Pipeline orchestration path is
    invoked from the process route.
  - verify: `pnpm --filter @consiliency/panel-backend exec vitest run __tests__/api/process.test.ts`

### SL-5 - Acceptance and docs-bounds reducer

- **Scope**: Reduce the route, formatter, client, and test outputs into the
  final `PANELROUTE` acceptance result while recording that docs remain bounded
  to the already-frozen `PANELINTAKE` contract.
- **Owned files**: `none`
- **Interfaces provided**: `PANELROUTE-acceptance-result`
- **Interfaces consumed**: IF-0-PANELROUTE-1, IF-0-PANELROUTE-2,
  IF-0-PANELROUTE-3, IF-0-PANELROUTE-4, IF-0-PANELROUTE-5,
  `PANELROUTE-process-sse-contract`, `PANELROUTE-client-event-compat`,
  `PANELROUTE-process-regression-matrix`
- **Parallel-safe**: no
- **Tasks**:
  - test: review every roadmap exit criterion against the updated route,
    formatter, client compatibility, and regression tests before marking the
    phase complete.
  - test: confirm docs remain intentionally unchanged here because
    `PANELINTAKE` already froze the body-section, label, marker, and redaction
    contract that this phase implements.
  - test: confirm the phase stays bounded away from Portal ingestion,
    Governed Pipeline execution, Message Board callbacks, and unrelated auth or
    model-provider changes.
  - impl: no additional repo writes; this reducer exists so acceptance and the
    "docs unchanged" decision depend on explicit review instead of prose order.
  - verify: `git diff --name-only -- baml_src/format.baml baml_src/types.baml baml_client packages/types/src/panel.ts packages/types/src/database.ts 'apps/backend/app/v1/panel/process/[id]/route.ts' apps/backend/__tests__/api/process.test.ts packages/core/src/client.ts packages/core/src/__tests__/client.test.ts packages/react/src/chat/PanelChat.tsx packages/react/src/chat/SubmitButton.tsx`
  - verify: `git diff --check -- baml_src/format.baml baml_src/types.baml packages/types/src/panel.ts packages/types/src/database.ts 'apps/backend/app/v1/panel/process/[id]/route.ts' apps/backend/__tests__/api/process.test.ts packages/core/src/client.ts packages/core/src/__tests__/client.test.ts packages/react/src/chat/PanelChat.tsx packages/react/src/chat/SubmitButton.tsx`

## Verification

Planning wrote the artifact only; verification was not run. During execution,
run the shared-contract and formatter generation work first, then the route and
consumer checks:

```bash
pnpm exec baml-cli generate
pnpm --filter @consiliency/panel-types build
pnpm --filter @consiliency/panel-core build
pnpm --filter @consiliency/panel-core exec vitest run src/__tests__/client.test.ts
pnpm --filter @consiliency/panel-react build
pnpm --filter @consiliency/panel-backend exec tsc -p tsconfig.json --noEmit
pnpm --filter @consiliency/panel-backend exec vitest run __tests__/api/process.test.ts
git diff --check -- baml_src/format.baml baml_src/types.baml packages/types/src/panel.ts packages/types/src/database.ts 'apps/backend/app/v1/panel/process/[id]/route.ts' apps/backend/__tests__/api/process.test.ts packages/core/src/client.ts packages/core/src/__tests__/client.test.ts packages/react/src/chat/PanelChat.tsx packages/react/src/chat/SubmitButton.tsx
git status --short -- specs/phase-plans-v1.md plans/phase-plan-v1-PANELROUTE.md baml_src/format.baml baml_src/types.baml baml_client packages/types/src/panel.ts packages/types/src/database.ts 'apps/backend/app/v1/panel/process/[id]/route.ts' apps/backend/__tests__/api/process.test.ts packages/core/src/client.ts packages/core/src/__tests__/client.test.ts packages/react/src/chat/PanelChat.tsx packages/react/src/chat/SubmitButton.tsx
```

## Acceptance Criteria

- [ ] Process SSE emits a typed `pipeline_handoff` event when a created issue is
  a governed-development intake candidate, and that event contains only bounded
  handoff metadata.
- [ ] GitHub issue creation uses the frozen `PANELINTAKE` body sections,
  labels, and tracking markers without post-hoc markdown scraping.
- [ ] Repo routing still preserves existing `panelRepo` behavior, and
  pipeline-intake candidacy is represented as a downstream hint rather than a
  third GitHub destination.
- [ ] Backend tests cover candidate emission, deferred fallback, replay for
  completed submissions, marker/label formatting, and explicit user-approved
  write boundaries.
- [ ] Core and React process-stream consumers remain compatible with the new
  event type and do not regress completion behavior.
- [ ] The panel backend does not invoke Portal ingestion, Governed Pipeline
  orchestration, or Message Board callbacks during this phase.
