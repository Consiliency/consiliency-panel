# @consiliency/panel

An embeddable, mode-aware chat panel for any web app. Guides users through structured feedback and issue creation, then posts well-formed GitHub issues via a BAML-powered pipeline.

## Packages

| Package | Description |
|---|---|
| `@consiliency/panel-types` | Shared TypeScript interfaces |
| `@consiliency/panel-core` | Framework-agnostic SDK (metadata, conversation, API client) |
| `@consiliency/panel-react` | React adapter with Shadow DOM mount, chat UI, screenshot capture |

## Install

```bash
pnpm add @consiliency/panel-react
```

Configure npm to pull `@consiliency` packages from GitHub Packages:

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

## Admin Setup

1. **Create an API key** — navigate to `/admin/api-keys` in the portal. Copy the raw key once (it is not stored).
2. **Grant roles** — navigate to `/admin/roles` to assign `guest`, `contractor`, or `team` tier to GitHub logins.
3. Set `NEXT_PUBLIC_PANEL_API_URL` and `NEXT_PUBLIC_PANEL_API_KEY` in your app's environment.

## Repo Routing (`panelRepo`)

When the panel is embedded in your own app, all feedback defaults to filing issues in `repo`. If you also want panel widget bugs to land in the panel's own repo automatically, set `panelRepo`:

```tsx
mountPanel({
  apiUrl: "...",
  apiKey: "...",
  repo: "your-org/your-app",           // host app issues go here
  panelRepo: "Consiliency/consiliency-panel",  // panel widget bugs go here
});
```

At submit time a BAML `RouteToRepo` agent examines the conversation transcript, page URL, and which screenshots were retained to decide whether the report is about the host app or the panel widget. The routing decision is emitted as a `routing` SSE event before the issue is created.

**Screenshot naming convention** — the router uses filename prefixes to infer screenshot kind:
- `screenshot-page-<timestamp>.png` → page screenshot (host app issue signal)
- `screenshot-panel-<timestamp>.png` → panel screenshot (panel widget issue signal)

If you build a custom screenshot pipeline, use these prefixes so the router can use them as signals.

## CORS Configuration (`PANEL_ALLOWED_ORIGINS`)

The backend defaults to reflecting any origin (permissive, suitable for local dev and early deploys). For production, lock it down:

```
# backend .env
PANEL_ALLOWED_ORIGINS=https://your-app.com,https://staging.your-app.com
```

If the origin is not in the allowlist, the backend returns no CORS headers and the browser blocks the request. The panel will silently fail to load. Check the browser Network tab for a CORS error if the panel button doesn't appear.

## Diagnosing Init Failures

If the panel button doesn't render, check the browser console for a `[Panel]` warning:

```
[Panel] SDK init failed: Capabilities fetch failed: 401.
Check your apiUrl, apiKey, and PANEL_ALLOWED_ORIGINS backend config.
```

Common causes:
- Wrong or missing `apiKey` → 401
- `apiUrl` points at wrong environment → network error or 404
- Origin not in `PANEL_ALLOWED_ORIGINS` → CORS error (preflight fails before auth)
- API key expired or deactivated in the admin panel

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
