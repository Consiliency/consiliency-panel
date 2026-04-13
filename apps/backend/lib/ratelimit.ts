/**
 * Per-API-key rate limiting via Upstash Redis sliding window.
 * Falls back to allowing the request if Upstash is not configured (dev/test).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimiter: Ratelimit | null = null;

function getRatelimiter(): Ratelimit | null {
  if (ratelimiter) return ratelimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  ratelimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 req/min per key
    analytics: false,
    prefix: "panel_rl",
  });
  return ratelimiter;
}

/** Returns true if the request should be blocked (rate limit exceeded). */
export async function isRateLimited(identifier: string): Promise<boolean> {
  const rl = getRatelimiter();
  if (!rl) return false; // No Redis configured — allow all (dev/test)

  const { success } = await rl.limit(identifier);
  return !success;
}

/** Standard 429 response */
export function tooManyRequests(): Response {
  return Response.json(
    { error: "Too many requests — please slow down" },
    {
      status: 429,
      headers: { "Retry-After": "60" },
    }
  );
}
