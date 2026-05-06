---
phase_loop_plan_version: 1
phase: PANELAUTH
roadmap: specs/phase-plans-v1.md
roadmap_sha256: cf672eb20092894bc58b47cb2023cad63469daf770736a50550324ec36c3b93a
---

# PANELAUTH: Portal-Managed Embedder Credential Posture

## Context

Roadmap source: `specs/phase-plans-v1.md`, Phase 2 (`PANELAUTH`). Canonical
`.phase-loop/state.json` marks `PANELINTAKE` as `complete`, `PANELAUTH` as
`unplanned`, and the repo as clean on `main` at
`cddd3f9fdf608531165c57aea8ce0730f3835d95` with the same roadmap hash recorded
by runner state.

The current implementation already exposes `apiKey` from
`NEXT_PUBLIC_PANEL_API_KEY` to the browser, validates `Authorization: Bearer`
credentials through `apps/backend/lib/auth.ts`, optionally clamps the returned
tier with `x-github-login`, and relies on `PANEL_ALLOWED_ORIGINS` to withhold
CORS headers from disallowed origins. The repo therefore already behaves like a
browser-embed credential system, not a server-only secret exchange.

`PANELAUTH` should freeze that posture instead of widening into a Portal proxy
rewrite unless the execution audit finds a concrete mismatch that cannot be
resolved with smaller hardening changes. The likely minimal path is to document
the browser key as intentionally public and scope-limited, align README and
embedder docs with the actual `product_key` and user-tier rules, and add
regression coverage for the failure modes the capability endpoint already owns.

## Interface Freeze Gates

- [ ] IF-0-PANELAUTH-1 - `NEXT_PUBLIC_PANEL_API_KEY` is frozen as an
  intentionally public embed credential whose authority is scope-limited by the
  backend to `product_key`, `max_tier`, `active`, optional `expires_at`, and
  origin allowlisting; no admin, service-role, or provider secrets move into
  client configuration.
- [ ] IF-0-PANELAUTH-2 - `GET /v1/panel/capabilities` keeps the auth contract
  `Authorization: Bearer <panel key>` plus optional `x-github-login`, validates
  keys through `panel_api_keys`, clamps user tier through `panel_user_roles`,
  returns `401` for missing, invalid, disabled, or expired keys, and preserves
  `429` only after successful key validation when the product is rate-limited.
- [ ] IF-0-PANELAUTH-3 - Origin behavior is frozen around
  `PANEL_ALLOWED_ORIGINS`: explicit allowlists are required for production,
  missing config remains a deliberate local-dev fallback that reflects request
  origins, and disallowed origins receive no CORS headers even if the bearer
  key itself is otherwise valid.
- [ ] IF-0-PANELAUTH-4 - README and `docs/embedder-contract.md` align on the
  exact responsibilities split: Portal issues, rotates, disables, and scopes
  panel API keys by product; embedders provide `repo`, optional `panelRepo`,
  `NEXT_PUBLIC_PANEL_API_URL`, and `NEXT_PUBLIC_PANEL_API_KEY`; backend env
  owns allowlists and service credentials; a Portal proxy is deferred unless a
  later hardening phase explicitly adopts it.
- [ ] IF-0-PANELAUTH-5 - Regression coverage names the capability failure cases
  for missing key, expired key, disabled key, and wrong-origin usage without
  printing raw keys, secret values, or other credential payloads in responses,
  logs, or docs.

## Lane Index & Dependencies

- SL-0 - Backend auth and origin contract; Depends on: (none); Blocks: SL-1,
  SL-2, SL-3; Parallel-safe: no
- SL-1 - Embedder credential posture docs; Depends on: SL-0; Blocks: SL-4;
  Parallel-safe: yes
- SL-2 - Portal admin and environment handoff docs; Depends on: SL-0; Blocks:
  SL-4; Parallel-safe: yes
- SL-3 - Capability auth regression coverage; Depends on: SL-0; Blocks: SL-4;
  Parallel-safe: yes
- SL-4 - Acceptance reducer; Depends on: SL-1, SL-2, SL-3; Blocks: (none);
  Parallel-safe: no

## Lanes

### SL-0 - Backend auth and origin contract

- **Scope**: Freeze the runtime contract for browser-supplied panel API keys,
  per-product tier resolution, and origin gating without introducing a new auth
  architecture.
- **Owned files**: `apps/backend/app/v1/panel/capabilities/route.ts`, `apps/backend/lib/auth.ts`, `apps/backend/lib/cors.ts`
- **Interfaces provided**: IF-0-PANELAUTH-1, IF-0-PANELAUTH-2,
  IF-0-PANELAUTH-3, `ValidatedKey`, `validateApiKey`, `resolveUserTier`,
  `withCors`, `corsPreflight`
- **Interfaces consumed**: pre-existing `PanelApiKey` and `PanelUserRole`
  schemas from `packages/types/src/database.ts`, request header
  `x-github-login`, and `CapabilitiesResponse` from
  `@consiliency/panel-types`
- **Parallel-safe**: no
- **Tasks**:
  - test: audit the current capabilities path to confirm where missing,
    disabled, expired, rate-limited, and wrong-origin requests currently fail.
  - impl: keep the phase on the minimal hardening path by retaining the browser
    bearer-key model unless a concrete mismatch forces a narrower runtime fix.
  - impl: align any runtime naming, comments, or helper boundaries needed so
    docs and tests can describe one exact contract for `product_key` scoping,
    user-tier clamping, and disallowed-origin behavior.
  - impl: do not add a Portal proxy, middleware auth, or non-capabilities route
    redesign in this phase.
  - verify: `pnpm --filter @consiliency/panel-backend exec tsc -p tsconfig.json --noEmit`
  - verify: `pnpm --filter @consiliency/panel-backend test -- __tests__/api/capabilities.test.ts`

### SL-1 - Embedder credential posture docs

- **Scope**: Make the embedder contract the source of truth for public-key
  posture, allowed origins, tier resolution inputs, and secret-handling rules.
- **Owned files**: `docs/embedder-contract.md`
- **Interfaces provided**: IF-0-PANELAUTH-1, IF-0-PANELAUTH-3,
  IF-0-PANELAUTH-4, `PANELAUTH-embedder-credential-contract`
- **Interfaces consumed**: `validateApiKey`, `resolveUserTier`, `withCors`,
  `CapabilitiesResponse`, Portal `IF-0-PINJ0-1`
- **Parallel-safe**: yes
- **Tasks**:
  - test: audit the current embedder contract for where it already describes
    `NEXT_PUBLIC_PANEL_API_KEY`, `PANEL_ALLOWED_ORIGINS`, init failures, and
    admin setup so the phase closes inconsistencies instead of rewriting the
    whole doc.
  - impl: state explicitly whether `NEXT_PUBLIC_PANEL_API_KEY` is intentionally
    public and scope-limited, what that scope limit is, and why it is not
    equivalent to a service credential.
  - impl: align the docs on allowed origins, `product_key` scoping,
    `x-github-login` tier resolution, and the difference between public embed
    config and backend-only secrets.
  - impl: document proxy deferral clearly: no Portal proxy is introduced here
    unless execution uncovers a contract break that cannot be fixed more
    narrowly.
  - verify: `rg -n "NEXT_PUBLIC_PANEL_API_KEY|public|scope-limited|product_key|x-github-login|PANEL_ALLOWED_ORIGINS|proxy|rotate|deactivate" docs/embedder-contract.md`

### SL-2 - Portal admin and environment handoff docs

- **Scope**: Align the top-level README with the credential posture decision
  and list the Portal-owned actions required to issue, rotate, disable, and
  scope embedder keys.
- **Owned files**: `README.md`
- **Interfaces provided**: `PANELAUTH-readme-admin-setup`,
  `PANELAUTH-portal-handoff-note`
- **Interfaces consumed**: `PANELAUTH-embedder-credential-contract`,
  Portal `IF-0-PINJ0-1`, `PANELINTAKE` intake boundary notes
- **Parallel-safe**: yes
- **Tasks**:
  - test: audit the current Quick Start, Admin Setup, Embedder Contract, CORS,
    and Backend Environment sections for where the auth posture is currently
    implied but not frozen.
  - impl: add concise README language that names `NEXT_PUBLIC_PANEL_API_KEY` as
    an embed credential, points readers to the detailed contract doc, and keeps
    service credentials out of client setup.
  - impl: list the Portal-admin responsibilities the Portal roadmap agent needs
    to own next: key issuance, one-time raw-key copy, rotation, disablement,
    allowed-origin coordination, and per-product role management.
  - impl: keep GitHub issue routing, model-provider setup, and proxy
    implementation details out of scope for this phase.
  - verify: `rg -n "NEXT_PUBLIC_PANEL_API_KEY|admin/api-keys|rotate|disable|product|PANEL_ALLOWED_ORIGINS|Embedder Contract" README.md`

### SL-3 - Capability auth regression coverage

- **Scope**: Add targeted regression coverage for the capability endpoint's auth
  and origin failure matrix without widening into full end-to-end deployment
  tests.
- **Owned files**: `apps/backend/__tests__/api/capabilities.test.ts`, `apps/backend/__tests__/lib/auth.test.ts`
- **Interfaces provided**: IF-0-PANELAUTH-5,
  `PANELAUTH-capabilities-failure-matrix`
- **Interfaces consumed**: `validateApiKey`, `resolveUserTier`, `withCors`,
  `PANELAUTH-embedder-credential-contract`
- **Parallel-safe**: yes
- **Tasks**:
  - test: extend route-level coverage so `GET /v1/panel/capabilities` proves
    the missing-key and wrong-origin cases against the documented contract.
  - test: add helper-level coverage for disabled and expired keys so the
    `panel_api_keys.active` and `panel_api_keys.expires_at` rules are asserted
    directly rather than only implied through mocks.
  - impl: keep the assertions redacted: no raw API keys, hashed values, or
    service credentials should appear in snapshots, bodies, or thrown errors.
  - impl: preserve the existing success-path and tier-clamp coverage while
    tightening only the failure matrix required by the roadmap.
  - verify: `pnpm --filter @consiliency/panel-backend exec vitest run __tests__/api/capabilities.test.ts __tests__/lib/auth.test.ts`
  - verify: `pnpm --filter @consiliency/panel-backend exec tsc -p tsconfig.json --noEmit`

### SL-4 - Acceptance reducer

- **Scope**: Reduce the runtime, docs, and regression outputs into a final
  `PANELAUTH` acceptance review without drifting into Portal or route-expansion
  work.
- **Owned files**: `none`
- **Interfaces provided**: `PANELAUTH-acceptance-result`
- **Interfaces consumed**: IF-0-PANELAUTH-1, IF-0-PANELAUTH-2,
  IF-0-PANELAUTH-3, IF-0-PANELAUTH-4, IF-0-PANELAUTH-5,
  `PANELAUTH-embedder-credential-contract`,
  `PANELAUTH-portal-handoff-note`, `PANELAUTH-capabilities-failure-matrix`
- **Parallel-safe**: no
- **Tasks**:
  - test: review every roadmap exit criterion against the updated runtime,
    README, docs, and regression tests before marking the phase complete.
  - test: confirm the phase stays bounded to auth/capabilities posture and does
    not change GitHub issue routing, model-provider wiring, or downstream
    Portal code.
  - impl: no additional repo writes; this reducer exists so closeout depends on
    explicit synthesized review rather than prose ordering.
  - verify: `git diff --name-only -- README.md docs/embedder-contract.md apps/backend/app/v1/panel/capabilities/route.ts apps/backend/lib/auth.ts apps/backend/lib/cors.ts apps/backend/__tests__/api/capabilities.test.ts apps/backend/__tests__/lib/auth.test.ts`
  - verify: `git diff --check -- README.md docs/embedder-contract.md apps/backend/app/v1/panel/capabilities/route.ts apps/backend/lib/auth.ts apps/backend/lib/cors.ts apps/backend/__tests__/api/capabilities.test.ts apps/backend/__tests__/lib/auth.test.ts`

## Verification

Planning wrote the artifact only; verification was not run. During execution,
run the focused auth and docs checks first, then confirm the phase stayed
bounded:

```bash
pnpm --filter @consiliency/panel-backend exec tsc -p tsconfig.json --noEmit
pnpm --filter @consiliency/panel-backend exec vitest run __tests__/api/capabilities.test.ts __tests__/lib/auth.test.ts
rg -n "NEXT_PUBLIC_PANEL_API_KEY|public|scope-limited|product_key|x-github-login|PANEL_ALLOWED_ORIGINS|proxy|rotate|deactivate" docs/embedder-contract.md
rg -n "NEXT_PUBLIC_PANEL_API_KEY|admin/api-keys|rotate|disable|product|PANEL_ALLOWED_ORIGINS|Embedder Contract" README.md
git diff --check -- README.md docs/embedder-contract.md apps/backend/app/v1/panel/capabilities/route.ts apps/backend/lib/auth.ts apps/backend/lib/cors.ts apps/backend/__tests__/api/capabilities.test.ts apps/backend/__tests__/lib/auth.test.ts
git status --short -- specs/phase-plans-v1.md plans/phase-plan-v1-PANELAUTH.md README.md docs/embedder-contract.md apps/backend/app/v1/panel/capabilities/route.ts apps/backend/lib/auth.ts apps/backend/lib/cors.ts apps/backend/__tests__/api/capabilities.test.ts apps/backend/__tests__/lib/auth.test.ts
```

## Acceptance Criteria

- [ ] Docs state whether `NEXT_PUBLIC_PANEL_API_KEY` is intentionally public and
  scope-limited, and that statement matches the runtime contract.
- [ ] README and `docs/embedder-contract.md` align on allowed origins,
  `product_key` scoping, user-tier resolution inputs, and Portal-owned
  rotation/disablement responsibilities.
- [ ] `GET /v1/panel/capabilities` preserves one exact auth contract for
  missing, invalid, disabled, expired, rate-limited, and wrong-origin requests.
- [ ] Capability regression coverage proves the missing-key, expired-key,
  disabled-key, and wrong-origin cases without printing secret values.
- [ ] The phase does not introduce a Portal proxy unless execution finds a real
  contract break that cannot be fixed more narrowly.
- [ ] The phase stays bounded to panel auth/capabilities posture and does not
  change GitHub issue routing or downstream Portal implementation.
