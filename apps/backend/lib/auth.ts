/**
 * Inline API key validation for Route Handlers.
 *
 * IMPORTANT: Auth MUST be called inline in each Route Handler, not via Next.js
 * middleware. Middleware-only auth is vulnerable to CVE-2025-29927 (x-middleware-subrequest bypass).
 */

import type { TrustTier } from "@consiliency/panel-types";
import { getServiceSupabase } from "./supabase";

function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  return crypto.subtle
    .digest("SHA-256", encoder.encode(input))
    .then((buf) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
}

export interface ValidatedKey {
  productKey: string;
  maxTier: TrustTier;
}

/** Validates Authorization: Bearer <key> header. Returns null if invalid/expired. */
export async function validateApiKey(req: Request): Promise<ValidatedKey | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) return null;

  const keyHash = await sha256(rawKey);

  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("panel_api_keys")
    .select("product_key, max_tier, active, expires_at")
    .eq("key_hash", keyHash)
    .single();

  if (!data || !data.active) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return {
    productKey: data.product_key as string,
    maxTier: data.max_tier as TrustTier,
  };
}

const TIER_RANK: Record<TrustTier, number> = { guest: 0, contractor: 1, team: 2 };

/**
 * Resolves the effective tier for a user. Clamps to maxTier from the API key.
 * Defaults to 'guest' if no role row exists.
 */
export async function resolveUserTier(
  githubLogin: string,
  productKey: string,
  maxTier: TrustTier
): Promise<TrustTier> {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("panel_user_roles")
    .select("role, expires_at")
    .eq("github_login", githubLogin)
    .eq("product_key", productKey)
    .single();

  if (!data) return "guest";
  if (data.expires_at && new Date(data.expires_at) < new Date()) return "guest";

  const userTier = data.role as TrustTier;
  // Clamp: never exceed what the API key allows
  return TIER_RANK[userTier] <= TIER_RANK[maxTier] ? userTier : maxTier;
}

/** Standard 401 response */
export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
