import type { TrustTier } from "@consiliency/panel-types";
import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";

const ThrottledOctokit = Octokit.plugin(throttling);

function makeClient(token: string | undefined, tier: TrustTier): Octokit {
  if (!token) {
    throw new Error(`Missing GitHub token for tier: ${tier}`);
  }
  return new ThrottledOctokit({
    auth: token,
    throttle: {
      onRateLimit: (retryAfter: number, options: { method: string; url: string }, octokit: Octokit) => {
        octokit.log.warn(`Rate limit hit for ${options.method} ${options.url}, retrying after ${retryAfter}s`);
        return true; // retry once
      },
      onSecondaryRateLimit: (_retryAfter: number, options: { method: string; url: string }, octokit: Octokit) => {
        octokit.log.warn(`Secondary rate limit for ${options.method} ${options.url}`);
        return false;
      },
    },
  });
}

// Cached clients (one per tier per process)
let guestClient: Octokit | null = null;
let contractorClient: Octokit | null = null;
let teamClient: Octokit | null = null;

/**
 * Returns an Octokit client scoped to the minimum permissions for the given tier.
 *
 * Tiers:
 * - guest:      labels + issues list only (GITHUB_TOKEN_GUEST)
 * - contractor: + file contents API, no blame (GITHUB_TOKEN_CONTRACTOR)
 * - team:       + blame, PRs, CI status (GITHUB_TOKEN_TEAM)
 */
export function getGitHubClient(tier: TrustTier): Octokit {
  switch (tier) {
    case "guest":
      guestClient ??= makeClient(process.env.GITHUB_TOKEN_GUEST, "guest");
      return guestClient;
    case "contractor":
      contractorClient ??= makeClient(process.env.GITHUB_TOKEN_CONTRACTOR, "contractor");
      return contractorClient;
    case "team":
      teamClient ??= makeClient(process.env.GITHUB_TOKEN_TEAM, "team");
      return teamClient;
  }
}

/** Parses "owner/repo" into { owner, repo } */
export function parseRepo(repoFullName: string): { owner: string; repo: string } {
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) throw new Error(`Invalid repo format: ${repoFullName}`);
  return { owner, repo };
}
