import { resolveUserTier, unauthorized, validateApiKey } from "@/lib/auth";
import { isRateLimited, tooManyRequests } from "@/lib/ratelimit";

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

  return Response.json({
    tier,
    modes: ["feedback"],
  });
}
