# Embedder Contract

This document is the single reference for teams embedding `@consiliency/panel` into their own app.

It covers:
- required client and backend configuration
- repo routing via `panelRepo`
- screenshot naming signals used by the router
- CORS behavior and production allowlisting
- what init failures look like and how to diagnose them

## Client configuration

Minimum embed configuration:

```tsx
mountPanel({
  apiUrl: process.env.NEXT_PUBLIC_PANEL_API_URL,
  apiKey: process.env.NEXT_PUBLIC_PANEL_API_KEY,
  repo: "your-org/your-app",
});
```

Or with the React provider:

```tsx
<PanelProvider
  config={{
    apiUrl: process.env.NEXT_PUBLIC_PANEL_API_URL,
    apiKey: process.env.NEXT_PUBLIC_PANEL_API_KEY,
    repo: "your-org/your-app",
  }}
>
  {children}
  <PanelButton />
  <PanelSheet />
</PanelProvider>
```

### Required client fields

| Field | Required | Description |
|---|---|---|
| `apiUrl` | Yes | Public backend base URL |
| `apiKey` | Yes | Panel API key issued by the admin portal |
| `repo` | Yes | Default GitHub repo for host-app issues |
| `panelRepo` | Optional | Separate GitHub repo for panel-widget issues |

## Backend environment

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `ANTHROPIC_API_KEY` | Yes | BAML pipeline key |
| `PANEL_INTERNAL_SECRET` | Yes | Internal secret for process route |
| `GITHUB_TOKEN_GUEST` | Yes | Read-only token (labels + issues) |
| `GITHUB_TOKEN_CONTRACTOR` | Yes | Read-only token (+ file tree) |
| `GITHUB_TOKEN_TEAM` | Yes | Read token (+ blame, PRs, CI) |
| `NEXT_PUBLIC_PANEL_API_URL` | Yes | Public API URL consumed by the embed |
| `PANEL_ALLOWED_ORIGINS` | Optional | Comma-separated allowed origins; defaults to allow-all |
| `UPSTASH_REDIS_REST_URL` | Optional | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Rate limiting |

## Repo routing with `panelRepo`

If you embed the panel in your own application, all reports normally file into `repo`.

If you also want bugs in the panel widget itself to go to the panel repository, set `panelRepo`:

```tsx
mountPanel({
  apiUrl: "...",
  apiKey: "...",
  repo: "your-org/your-app",
  panelRepo: "Consiliency/consiliency-panel",
});
```

At submit time, the `RouteToRepo` agent uses:
- the conversation transcript
- the current page URL/title
- retained screenshot kinds

to decide whether the report belongs in the host app repo or the panel repo.

The routing decision is emitted as a `routing` SSE event before issue creation.

## Screenshot naming convention

If you use the built-in screenshot flow, the React client already emits the correct names.

If you build a custom screenshot pipeline, keep these filename prefixes so routing can infer screenshot kind:

- `screenshot-page-<timestamp>.png` → host app screenshot
- `screenshot-panel-<timestamp>.png` → panel widget screenshot

Without these prefixes, the router loses one of its strongest classification signals.

## CORS configuration

By default, the backend reflects any origin. That is convenient for local development, but production deployments should set an explicit allowlist:

```env
PANEL_ALLOWED_ORIGINS=https://your-app.com,https://staging.your-app.com
```

If the current origin is not allowlisted, the backend returns no CORS headers and the browser blocks the request.

Typical symptom: the panel never initializes and no requests succeed in the browser.

## Diagnosing init failures

The React SDK logs a `[Panel]` warning when initialization fails.

Example:

```text
[Panel] SDK init failed: Capabilities fetch failed: 401.
Check your apiUrl, apiKey, and PANEL_ALLOWED_ORIGINS backend config.
```

Common causes:
- wrong or missing `apiKey`
- `apiUrl` points at the wrong backend or environment
- current origin missing from `PANEL_ALLOWED_ORIGINS`
- API key expired or deactivated in the admin portal

When debugging, check:
1. browser console warnings
2. browser network requests for CORS / 401 / 404 failures
3. backend env configuration for origin allowlisting and keys
