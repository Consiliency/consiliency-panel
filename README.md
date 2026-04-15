# @consiliency/panel

An embeddable, mode-aware chat panel for any web app. Guides users through structured feedback and issue creation, then posts well-formed GitHub issues via a BAML-powered pipeline.

## Packages

| Package | Description |
|---|---|
| `@consiliency/panel-types` | Shared TypeScript interfaces |
| `@consiliency/panel-core` | Framework-agnostic SDK (metadata, conversation, API client) |
| `@consiliency/panel-react` | React adapter with Shadow DOM mount, chat UI, screenshot capture |

## Install

Two supported paths:

### A. From the `release` branch (recommended for outside embedders)

CI maintains a `release` branch that ships a prebuilt, self-contained artifact — no GitHub Packages token, no workspace resolution.

```bash
pnpm add "github:Consiliency/consiliency-panel#release"
# or
npm install "github:Consiliency/consiliency-panel#release"
```

Then:

```tsx
import { mountPanel } from "@consiliency/panel-react";
import "@consiliency/panel-react/styles";
```

The package reads from `./dist` with `@consiliency/panel-core` and `@consiliency/panel-types` inlined.

### B. From GitHub Packages (for org members / CI with a `read:packages` token)

```bash
pnpm add @consiliency/panel-react
```

```
# .npmrc
@consiliency:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Quick Start

```tsx
import { mountPanel } from "@consiliency/panel-react";
import "@consiliency/panel-react/styles";

mountPanel({
  apiUrl: process.env.NEXT_PUBLIC_PANEL_API_URL,
  apiKey: process.env.NEXT_PUBLIC_PANEL_API_KEY,
  repo: "your-org/your-repo",
});
```

Or use the React provider directly:

```tsx
import { PanelProvider, PanelButton, PanelSheet } from "@consiliency/panel-react";

export default function Layout({ children }) {
  return (
    <PanelProvider
      config={{
        apiUrl: process.env.NEXT_PUBLIC_PANEL_API_URL,
        apiKey: process.env.NEXT_PUBLIC_PANEL_API_KEY,
        repo: "your-org/your-repo",
      }}
    >
      {children}
      <PanelButton />
      <PanelSheet />
    </PanelProvider>
  );
}
```

## Theming

Override CSS custom properties on `:root` (or pass a `theme` object to `mountPanel`):

| Variable | Default | Description |
|---|---|---|
| `--panel-bg` | `#ffffff` | Panel background |
| `--panel-fg` | `#111827` | Panel text color |
| `--panel-border` | `#e5e7eb` | Border color |
| `--panel-accent` | `#6366f1` | Accent / button color |
| `--panel-radius` | `0.75rem` | Border radius |
| `--panel-width` | `420px` | Panel sheet width |
| `--panel-button-position-bottom` | `1.5rem` | FAB distance from bottom |
| `--panel-button-position-right` | `1.5rem` | FAB distance from right |

```css
:root {
  --panel-accent: #your-brand-color;
  --panel-width: 380px;
}
```

## Access Tiers

The panel resolves a trust tier from the caller's API key + GitHub login:

| Tier | Context depth |
|---|---|
| `guest` | Labels + recent open issues |
| `contractor` | + File tree (no blame) |
| `team` | + Blame, PRs, CI status |

## BAML Customization

The issue pipeline (`ClassifyIssue → EnrichWithRepoContext → FormatAsGitHubIssue`) lives in `baml_src/`. Edit the prompts there and regenerate:

```bash
baml-cli generate
```

Model assignments (in `baml_src/clients.baml`):
- `ClassifyIssue` — `claude-haiku-4-5` (fast triage)
- `EnrichWithRepoContext` — `claude-sonnet-4-6` (code reasoning)
- `FormatAsGitHubIssue` — `claude-sonnet-4-6` (quality output)

### Agentic feedback (beta)

The `feedback` mode runs an LLM-driven intake loop (`NextTurn` → structured tool calls → editable draft → user-approved submit → optional `NextCommentTurn` for follow-up). While in beta, embedders see an in-panel **model picker** with five multimodal options for the conversation agent:

| Label | BAML client | Provider |
|---|---|---|
| GPT-5 Nano (default) | `OpenAINano` | OpenAI |
| Claude Haiku 4.5 | `ClaudeHaiku` | Anthropic |
| Gemini 3.1 Flash-Lite | `GeminiFlashLite` | Google / OpenRouter |
| Gemma 3 27B | `Gemma3` | Google / OpenRouter |
| Kimi-VL | `KimiVL` | Moonshot / OpenRouter |

Turn the picker off in production via embedder config (`betaModelSelection: false`) or backend env (`PANEL_BETA_MODEL_SELECTION=false`). When disabled, the backend ignores any `selectedModelId` and falls back to the default client for both intake and comment drafting. A fixed `TopicCheck` client (always cheapest Nano) runs an input-scope guardrail before every agent turn and is never user-selectable.

## Admin Setup

1. **Create an API key** — navigate to `/admin/api-keys` in the portal. Copy the raw key once (it is not stored).
2. **Grant roles** — navigate to `/admin/roles` to assign `guest`, `contractor`, or `team` tier to GitHub logins.
3. Set `NEXT_PUBLIC_PANEL_API_URL` and `NEXT_PUBLIC_PANEL_API_KEY` in your app's environment.

## Embedder Contract

For the full embedding reference — including required config, `panelRepo` routing, screenshot naming, CORS allowlisting, and init-failure diagnosis — see [`docs/embedder-contract.md`](docs/embedder-contract.md).

## Repo Routing (`panelRepo`)

Use `panelRepo` if you want panel-widget bugs routed separately from host-app issues. Full routing behavior and screenshot naming requirements are documented in [`docs/embedder-contract.md`](docs/embedder-contract.md).

## CORS Configuration (`PANEL_ALLOWED_ORIGINS`)

For production deploys, set `PANEL_ALLOWED_ORIGINS` explicitly. Configuration details and failure modes are documented in [`docs/embedder-contract.md`](docs/embedder-contract.md).

## Diagnosing Init Failures

If the panel button does not render, check the browser console for `[Panel]` warnings and use the troubleshooting guidance in [`docs/embedder-contract.md`](docs/embedder-contract.md).

## Backend Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `ANTHROPIC_API_KEY` | Yes | For BAML pipeline |
| `PANEL_INTERNAL_SECRET` | Yes | Internal secret for process route |
| `GITHUB_TOKEN_GUEST` | Yes | Read-only token (labels + issues) |
| `GITHUB_TOKEN_CONTRACTOR` | Yes | Read-only token (+ file tree) |
| `GITHUB_TOKEN_TEAM` | Yes | Read token (+ blame, PRs, CI) |
| `NEXT_PUBLIC_PANEL_API_URL` | Yes | Public API URL |
| `PANEL_ALLOWED_ORIGINS` | Optional | Comma-separated allowed origins (defaults to allow-all) |
| `UPSTASH_REDIS_REST_URL` | Optional | Rate limiting (falls back to allow-all) |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Rate limiting |
