import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../app/v1/panel/process/[id]/route";

vi.mock("../../lib/supabase", () => ({
  getServiceSupabase: vi.fn(),
}));

vi.mock("../../lib/github", () => ({
  getGitHubClient: vi.fn(),
  parseRepo: vi.fn(),
}));

// Mock the BAML client
vi.mock("baml_client", () => ({
  b: {
    ClassifyIssue: vi.fn(),
    EnrichWithRepoContext: vi.fn(),
    FormatAsGitHubIssue: vi.fn(),
  },
}));

import * as supabaseLib from "../../lib/supabase";
import * as githubLib from "../../lib/github";
import type { SupabaseClient } from "@supabase/supabase-js";

const INTERNAL_SECRET = "test-internal-secret";

function makeRequest(id: string, body: unknown = { repo: "Owner/repo" }): Request {
  return new Request(`https://panel-api.consiliency.io/v1/panel/process/${id}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${INTERNAL_SECRET}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

const MOCK_SUBMISSION = {
  id: "sub-abc",
  product_key: "test",
  github_login: null,
  tier: "guest",
  transcript: [
    { role: "user", content: "Button broken", timestamp: "2026-01-01T00:00:00Z" },
  ],
  metadata: {
    url: "https://example.com",
    title: "Test",
    userAgent: "Mozilla",
    viewport: { width: 1280, height: 720 },
    timestamp: "2026-01-01T00:00:00Z",
    referrer: "",
  },
  console_errors: null,
  screenshot_url: null,
  status: "pending",
};

const MOCK_ISSUE_OUTPUT = {
  github_title: "Bug: Button is broken",
  github_body: "## Description\nThe button is broken.\n\n## Steps to Reproduce\n1. Click button",
  labels: ["bug"],
  assignee: undefined,
  plain_summary: "The submit button is not working on the dashboard page.",
  technical_details: "URL: https://example.com\nBrowser: Mozilla",
  priority: "high",
};

function makeSupabaseMock() {
  const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const singleMock = vi.fn().mockResolvedValue({ data: MOCK_SUBMISSION, error: null });
  const selectMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: singleMock }) });

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "panel_submissions") return { update: updateMock, select: selectMock };
      if (table === "panel_issues") return { insert: insertMock };
      return { update: updateMock, select: selectMock, insert: insertMock };
    }),
  } as unknown as SupabaseClient;
}

describe("POST /v1/panel/process/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without internal secret", async () => {
    const req = new Request("https://panel-api.consiliency.io/v1/panel/process/abc", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret", "content-type": "application/json" },
      body: JSON.stringify({ repo: "Owner/repo" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "abc" }) });
    expect(res.status).toBe(401);
  });

  it("runs BAML pipeline and streams SSE events ending with complete", async () => {
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(makeSupabaseMock());

    vi.mocked(githubLib.parseRepo).mockReturnValue({ owner: "Owner", repo: "repo" });
    vi.mocked(githubLib.getGitHubClient).mockReturnValue({
      issues: {
        listLabelsForRepo: vi.fn().mockResolvedValue({ data: [{ name: "bug", description: "A bug", color: "d73a4a" }] }),
        listForRepo: vi.fn().mockResolvedValue({ data: [] }),
        create: vi.fn().mockResolvedValue({ data: { number: 42, html_url: "https://github.com/Owner/repo/issues/42" } }),
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { b } = await import("baml_client");
    vi.mocked(b.ClassifyIssue).mockResolvedValue({
      category: "bug", severity: "high", labels: [{ name: "bug", reason: "It is a bug" }], requires_reproduction: true,
    });
    vi.mocked(b.EnrichWithRepoContext).mockResolvedValue({
      relevant_files: [], related_issues: [], suggested_assignee: null, reproduction_steps: [],
    });
    vi.mocked(b.FormatAsGitHubIssue).mockResolvedValue(MOCK_ISSUE_OUTPUT);

    const res = await POST(makeRequest("sub-abc"), { params: Promise.resolve({ id: "sub-abc" }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    // Read the SSE stream
    const text = await res.text();
    const events = text
      .split("\n\n")
      .filter(Boolean)
      .map((chunk) => {
        const line = chunk.replace(/^data: /, "").trim();
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);

    const types = events.map((e) => e.type);
    expect(types).toContain("progress");
    expect(types[types.length - 1]).toBe("complete");

    const completeEvent = events.find((e) => e.type === "complete");
    expect(completeEvent?.issueUrl).toContain("github.com");
    expect(completeEvent?.issueNumber).toBe(42);
  });
});
