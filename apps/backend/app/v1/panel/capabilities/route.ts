import { resolveUserTier, unauthorized, validateApiKey } from "@/lib/auth";
import { isRateLimited, tooManyRequests } from "@/lib/ratelimit";
import { corsPreflight, withCors } from "@/lib/cors";
import { PANEL_MODELS, DEFAULT_MODEL_ID, isBetaModelSelectionEnabled } from "@/lib/model-catalog";

export async function OPTIONS(req: Request) { return corsPreflight(req); }

export async function GET(req: Request): Promise<Response> {
  // Auth inline — not via middleware (CVE-2025-29927)
  const key = await validateApiKey(req);
  if (!key) return withCors(unauthorized(), req);

  if (await isRateLimited(key.productKey)) return withCors(tooManyRequests(), req);

  const githubLogin = req.headers.get("x-github-login");

  let tier = key.maxTier;
  if (githubLogin) {
    tier = await resolveUserTier(githubLogin, key.productKey, key.maxTier);
  }

  const betaModelSelection = isBetaModelSelectionEnabled();

  return withCors(
    Response.json({
      tier,
      modes: ["feedback"],
      betaModelSelection,
      models: betaModelSelection ? PANEL_MODELS : [],
      defaultModelId: DEFAULT_MODEL_ID,
    }),
    req,
  );
}
