import { resolveUserTier, unauthorized, validateApiKey } from "@/lib/auth";
import { isRateLimited, tooManyRequests } from "@/lib/ratelimit";
import { getGitHubClient, parseRepo } from "@/lib/github";
import type { RepoContext } from "@consiliency/panel-types";

export async function POST(req: Request): Promise<Response> {
  const key = await validateApiKey(req);
  if (!key) return unauthorized();

  if (await isRateLimited(key.productKey)) return tooManyRequests();

  const body = (await req.json()) as {
    repo: string;
    query: string;
    files?: string[];
    githubLogin?: string;
  };

  const tier = body.githubLogin
    ? await resolveUserTier(body.githubLogin, key.productKey, key.maxTier)
    : key.maxTier;

  const octokit = getGitHubClient(tier);
  const { owner, repo } = parseRepo(body.repo);

  const context: RepoContext = { tier };

  // All tiers: get labels
  const { data: labels } = await octokit.issues.listLabelsForRepo({ owner, repo, per_page: 50 });
  context.labels = labels.map((l) => ({ name: l.name, description: l.description ?? undefined, color: l.color }));

  // All tiers: recent open issues (for duplicate detection)
  const { data: issues } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: 20,
    sort: "updated",
  });
  context.recentIssues = issues.map((i) => ({
    number: i.number,
    title: i.title,
    state: i.state,
    url: i.html_url,
  }));

  // Contractor + team: relevant file tree
  if (tier === "contractor" || tier === "team") {
    const { data: tree } = await octokit.git.getTree({ owner, repo, tree_sha: "HEAD", recursive: "1" });
    context.relevantFiles = tree.tree
      .filter((f) => f.type === "blob" && f.path)
      .map((f) => f.path!)
      .slice(0, 100);
  }

  return Response.json(context);
}
