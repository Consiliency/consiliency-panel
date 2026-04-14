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
    RouteToRepo: vi.fn(),
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

function makeSupabaseMock(submission = MOCK_SUBMISSION) {
  const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const singleMock = vi.fn().mockResolvedValue({ data: submission, error: null });
  const selectMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: singleMock }) });
  const validKeySingleMock = vi.fn().mockResolvedValue({
    data: { product_key: "test", max_tier: "guest", active: true, expires_at: null },
  });
  const keySelectMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: validKeySingleMock }) });

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "panel_api_keys") return { select: keySelectMock };
      if (table === "panel_submissions") return { update: updateMock, select: selectMock };
      if (table === "panel_issues") return { insert: insertMock };
      return { update: updateMock, select: selectMock, insert: insertMock };
    }),
  } as unknown as SupabaseClient;
}

function makeUnauthorizedSupabaseMock() {
  const nullSingleMock = vi.fn().mockResolvedValue({ data: null });
  const selectMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: nullSingleMock }) });
  return {
    from: vi.fn().mockReturnValue({ select: selectMock }),
  } as unknown as SupabaseClient;
}

function makeGitHubMock(issueNumber = 42, repoOverride?: string) {
  const createMock = vi.fn().mockImplementation(({ owner, repo }: { owner: string; repo: string }) => ({
    data: {
      number: issueNumber,
      html_url: `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
    },
  }));
  return {
    issues: {
      listLabelsForRepo: vi.fn().mockResolvedValue({ data: [{ name: "bug", description: "A bug", color: "d73a4a" }] }),
      listForRepo: vi.fn().mockResolvedValue({ data: [] }),
      create: createMock,
    },
    createMock, // exposed for assertions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

async function parseSSE(res: Response): Promise<Array<Record<string, unknown>>> {
  const text = await res.text();
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((chunk) => {
      const line = chunk.replace(/^data: /, "").trim();
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

async function setupBamlMocks() {
  const { b } = await import("baml_client");
  vi.mocked(b.ClassifyIssue).mockResolvedValue({
    category: "bug", severity: "high", labels: [{ name: "bug", reason: "It is a bug" }], requires_reproduction: true,
  });
  vi.mocked(b.EnrichWithRepoContext).mockResolvedValue({
    relevant_files: [], related_issues: [], suggested_assignee: null, reproduction_steps: [],
  });
  vi.mocked(b.FormatAsGitHubIssue).mockResolvedValue(MOCK_ISSUE_OUTPUT);
  return b;
}

describe("POST /v1/panel/process/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without internal secret", async () => {
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(makeUnauthorizedSupabaseMock());
    const req = new Request("https://panel-api.consiliency.io/v1/panel/process/abc", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret", "content-type": "application/json" },
      body: JSON.stringify({ repo: "Owner/repo" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "abc" }) });
    expect(res.status).toBe(401);
  });

  it("runs BAML pipeline and streams SSE events ending with completed", async () => {
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(makeSupabaseMock());
    vi.mocked(githubLib.parseRepo).mockReturnValue({ owner: "Owner", repo: "repo" });
    vi.mocked(githubLib.getGitHubClient).mockReturnValue(makeGitHubMock());

    const b = await setupBamlMocks();

    const res = await POST(makeRequest("sub-abc"), { params: Promise.resolve({ id: "sub-abc" }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const events = await parseSSE(res);
    const types = events.map((e) => e.type);
    expect(types).toContain("progress");
    expect(types[types.length - 1]).toBe("completed");

    const completeEvent = events.find((e) => e.type === "completed");
    expect(completeEvent?.issueUrl).toContain("github.com");
    expect(completeEvent?.issueNumber).toBe(42);

    // RouteToRepo must NOT be called when panelRepo is absent
    expect(vi.mocked(b.RouteToRepo)).not.toHaveBeenCalled();
  });

  describe("panelRepo routing", () => {
    const APP_REPO = "Owner/app-repo";
    const PANEL_REPO = "Consiliency/consiliency-panel";

    function setupParseRepo() {
      vi.mocked(githubLib.parseRepo).mockImplementation((r: string) => {
        const [owner, repo] = r.split("/");
        return { owner, repo };
      });
    }

    it("emits routing SSE event and files issue in panelRepo when RouteToRepo returns 'panel'", async () => {
      vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(makeSupabaseMock());
      setupParseRepo();
      const gh = makeGitHubMock(7);
      vi.mocked(githubLib.getGitHubClient).mockReturnValue(gh);

      const b = await setupBamlMocks();
      vi.mocked(b.RouteToRepo).mockResolvedValue({
        target: "panel", reasoning: "User described widget UI bug", confidence: "high",
      });

      const res = await POST(
        makeRequest("sub-abc", { repo: APP_REPO, panelRepo: PANEL_REPO }),
        { params: Promise.resolve({ id: "sub-abc" }) }
      );
      const events = await parseSSE(res);

      // routing SSE event is emitted with correct shape
      const routingEvent = events.find((e) => e.type === "routing");
      expect(routingEvent).toBeDefined();
      expect(routingEvent?.target).toBe("panel");
      expect(routingEvent?.targetRepo).toBe(PANEL_REPO);
      expect(routingEvent?.confidence).toBe("high");

      // GitHub issue created in the panel repo
      const createCall = gh.createMock.mock.calls[0][0] as { owner: string; repo: string };
      expect(createCall.owner).toBe("Consiliency");
      expect(createCall.repo).toBe("consiliency-panel");

      // completed event URL references the panel repo
      const completeEvent = events.find((e) => e.type === "completed");
      expect(completeEvent?.issueUrl).toContain("Consiliency/consiliency-panel");
    });

    it("files issue in app repo when RouteToRepo returns 'app'", async () => {
      vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(makeSupabaseMock());
      setupParseRepo();
      const gh = makeGitHubMock(99);
      vi.mocked(githubLib.getGitHubClient).mockReturnValue(gh);

      const b = await setupBamlMocks();
      vi.mocked(b.RouteToRepo).mockResolvedValue({
        target: "app", reasoning: "User described a portal page bug", confidence: "high",
      });

      const res = await POST(
        makeRequest("sub-abc", { repo: APP_REPO, panelRepo: PANEL_REPO }),
        { params: Promise.resolve({ id: "sub-abc" }) }
      );
      const events = await parseSSE(res);

      const routingEvent = events.find((e) => e.type === "routing");
      expect(routingEvent?.target).toBe("app");
      expect(routingEvent?.targetRepo).toBe(APP_REPO);

      const createCall = gh.createMock.mock.calls[0][0] as { owner: string; repo: string };
      expect(createCall.owner).toBe("Owner");
      expect(createCall.repo).toBe("app-repo");
    });

    it("passes correct screenshot kind hints to RouteToRepo", async () => {
      const submissionWithScreenshots = {
        ...MOCK_SUBMISSION,
        attachment_urls: [
          { url: "https://storage.example.com/page.png", type: "screenshot", name: "screenshot-page-1735689600000.png" },
          { url: "https://storage.example.com/panel.png", type: "screenshot", name: "screenshot-panel-1735689601000.png" },
          { url: "https://storage.example.com/file.pdf", type: "file", name: "report.pdf" },
        ],
      };
      vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(makeSupabaseMock(submissionWithScreenshots));
      setupParseRepo();
      vi.mocked(githubLib.getGitHubClient).mockReturnValue(makeGitHubMock());

      const b = await setupBamlMocks();
      vi.mocked(b.RouteToRepo).mockResolvedValue({
        target: "app", reasoning: "Both screenshots present; transcript is decisive", confidence: "medium",
      });

      const res = await POST(
        makeRequest("sub-abc", { repo: APP_REPO, panelRepo: PANEL_REPO }),
        { params: Promise.resolve({ id: "sub-abc" }) }
      );
      // Must drain the stream before asserting side-effects: the ReadableStream
      // start() handler is async and POST returns before it finishes executing.
      await parseSSE(res);

      expect(vi.mocked(b.RouteToRepo)).toHaveBeenCalledOnce();
      const [, , retainedKinds] = vi.mocked(b.RouteToRepo).mock.calls[0];
      // Only screenshot attachments are passed; the PDF is excluded
      expect(retainedKinds).toEqual(["page", "panel"]);
    });

    it("does not call RouteToRepo when panelRepo is absent", async () => {
      vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(makeSupabaseMock());
      vi.mocked(githubLib.parseRepo).mockReturnValue({ owner: "Owner", repo: "app-repo" });
      vi.mocked(githubLib.getGitHubClient).mockReturnValue(makeGitHubMock());

      const b = await setupBamlMocks();

      const res = await POST(
        makeRequest("sub-abc", { repo: APP_REPO }), // no panelRepo
        { params: Promise.resolve({ id: "sub-abc" }) }
      );
      await parseSSE(res); // drain stream before asserting side-effects

      expect(vi.mocked(b.RouteToRepo)).not.toHaveBeenCalled();
    });
  });
});
