import { resolveUserTier, unauthorized, validateApiKey } from "@/lib/auth";
import { isRateLimited, tooManyRequests } from "@/lib/ratelimit";
import { corsPreflight, withCors } from "@/lib/cors";

export async function OPTIONS(req: Request) { return corsPreflight(req); }

export async function GET(req: Request): Promise<Response> {
  // Auth inline — not via middleware (CVE-2025-29927)
  const key = await validateApiKey(req);
  if (!key) return unauthorized();

  if (await isRateLimited(key.productKey)) return tooManyRequests();

  const githubLogin = req.headers.get("x-github-login");

  let tier = key.maxTier;
  if (githubLogin) {
    tier = await resolveUserTier(githubLogin, key.productKey, key.maxTier);
  }

  return withCors(Response.json({ tier, modes: ["feedback"] }), req);
}
