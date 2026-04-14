/**
 * CORS helper for panel API route handlers.
 *
 * Allowed origins are read from PANEL_ALLOWED_ORIGINS (comma-separated).
 * Falls back to permitting any origin if the env var is not set, so local
 * development and early-stage deployments work without extra config.
 */

const ALLOWED_ORIGINS = process.env.PANEL_ALLOWED_ORIGINS
  ? process.env.PANEL_ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : null; // null = allow all

function corsOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return "*";
  if (!ALLOWED_ORIGINS) return requestOrigin; // allow all — reflect the request origin
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : "";
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = corsOrigin(origin);
  if (!allowed) return {};
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-github-login",
    "Access-Control-Max-Age": "86400",
    ...(allowed !== "*" ? { Vary: "Origin" } : {}),
  };
}

/** Responds to CORS preflight OPTIONS requests. */
export function corsPreflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

/** Adds CORS headers to an existing Response. */
export function withCors(res: Response, req: Request): Response {
  const headers = corsHeaders(req);
  const next = new Response(res.body, res);
  Object.entries(headers).forEach(([k, v]) => next.headers.set(k, v));
  return next;
}
