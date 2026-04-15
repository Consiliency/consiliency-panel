import { b } from "baml_client";

export async function checkTopic(
  message: string,
  appContext: string,
): Promise<{ onTopic: boolean; redirectHint?: string }> {
  try {
    const res = await b.IsOnTopic(message, appContext);
    return {
      onTopic: res.on_topic,
      redirectHint: res.redirect_hint ?? undefined,
    };
  } catch (err) {
    console.warn("[agent-guardrails] topic check failed — defaulting to on-topic:", err);
    return { onTopic: true };
  }
}

const SECRET_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /ghp_[A-Za-z0-9]{20,}/g, replacement: "[redacted-github-token]" },
  { pattern: /gho_[A-Za-z0-9]{20,}/g, replacement: "[redacted-github-token]" },
  { pattern: /github_pat_[A-Za-z0-9_]{20,}/g, replacement: "[redacted-github-token]" },
  { pattern: /sk-[A-Za-z0-9-_]{20,}/g, replacement: "[redacted-api-key]" },
  { pattern: /sk-ant-[A-Za-z0-9-_]{20,}/g, replacement: "[redacted-api-key]" },
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: "[redacted-aws-access-key]" },
  { pattern: /AIza[0-9A-Za-z_-]{35}/g, replacement: "[redacted-google-key]" },
  { pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: "[redacted-jwt]" },
];

export function scrubSecrets(text: string): string {
  let out = text;
  for (const { pattern, replacement } of SECRET_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function buildAppContext(repo: string, panelRepo?: string): string {
  const lines = [
    `Embedded feedback panel for repo ${repo}.`,
    panelRepo ? `Panel widget bugs route separately to ${panelRepo}.` : null,
    `Scope: feedback, bug reports, feature requests, or support questions about the app at this repo.`,
  ].filter(Boolean);
  return lines.join(" ");
}
