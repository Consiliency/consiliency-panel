import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PanelIssueTechnicalDetails } from "@consiliency/panel-types";
import { POST } from "../../app/v1/panel/process/[id]/route";

vi.mock("../../lib/supabase", () => ({
  getServiceSupabase: vi.fn(),
}));

vi.mock("../../lib/github", () => ({
  getGitHubClient: vi.fn(),
  parseRepo: vi.fn(),
}));

vi.mock("baml_client", () => ({
  b: {
    ClassifyIssue: vi.fn(),
    EnrichWithRepoContext: vi.fn(),
    FormatAsGitHubIssue: vi.fn(),
    RouteToRepo: vi.fn(),
  },
}));

import * as githubLib from "../../lib/github";
import * as supabaseLib from "../../lib/supabase";

const INTERNAL_SECRET = "test-internal-secret";
const APP_REPO = "Owner/app-repo";
const PANEL_REPO = "Consiliency/consiliency-panel";

function makeRequest(
  id: string,
  body: unknown = { repo: APP_REPO },
): Request {
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
  github_login: "alice",
  tier: "guest",
  transcript: [
    { role: "user", content: "The submit button is broken", timestamp: "2026-01-01T00:00:00Z" },
  ],
  metadata: {
    url: "https://example.com/dashboard",
    title: "Dashboard",
    userAgent: "Mozilla",
    viewport: { width: 1280, height: 720 },
    timestamp: "2026-01-01T00:00:00Z",
    referrer: "",
  },
  console_errors: null,
  console_warnings: null,
  screenshot_url: null,
  navigation_breadcrumb: [
    { url: "https://example.com", title: "Home", ts: "2026-01-01T00:00:00Z" },
    { url: "https://example.com/dashboard", title: "Dashboard", ts: "2026-01-01T00:00:05Z" },
  ],
  component_hint: "src/components/SubmitButton.tsx",
  attachment_urls: [
    {
      url: "https://storage.example.com/page.png",
      type: "screenshot",
      name: "screenshot-page-1735689600000.png",
    },
  ],
  selected_model_id: "claude-sonnet",
  status: "pending",
};

const MOCK_ISSUE_OUTPUT = {
  github_title: "Bug: Submit button fails on dashboard",
  issue_sections: {
    summary: "Users cannot complete submission from the dashboard.",
    user_approved_details: "1. Open the dashboard.\n2. Click Submit.\n3. Nothing happens.",
    environment: "- URL: https://example.com/dashboard\n- Browser: Mozilla",
    routing: "This issue belongs in the host application repository.",
    pipeline_intake_handoff: "Governed development intake is appropriate because this blocks core workflow.",
    linked_evidence: "- Screenshot: https://storage.example.com/page.png",
  },
  labels: ["bug", "priority:high"],
  issue_markers: {
    panel_source: "panel",
    panel_submission_id: "placeholder",
    panel_product_key: "placeholder",
    panel_target: "host_app",
    panel_repo_decision: "app",
    panel_intake_candidate: "candidate",
    panel_screenshot_kinds: "page",
    panel_summary_ref: "dashboard-submit",
    panel_pipeline_hint: "core workflow blocker",
  },
  pipeline_handoff: {
    status: "candidate",
    pipeline_hint: "core workflow blocker",
    forwardable_metadata_summary: "Dashboard submission is blocked for authenticated users.",
  },
  assignee: undefined,
  plain_summary: "The dashboard submit button does not respond when clicked.",
  technical_details: "Relevant file: src/components/SubmitButton.tsx",
  priority: "high",
};

interface SupabaseMockOptions {
  submission?: typeof MOCK_SUBMISSION;
  idempotencyAcquired?: boolean;
  existingStatus?: "completed" | "processing";
  existingIssue?: {
    github_issue_url: string;
    github_issue_number: number;
    plain_summary: string;
    technical_details?: PanelIssueTechnicalDetails | null;
  } | null;
}

function makeSupabaseMock(options: SupabaseMockOptions = {}) {
  const submission = options.submission ?? MOCK_SUBMISSION;
  const insertIssue = vi.fn().mockResolvedValue({ error: null });
  let submissionUpdateCount = 0;

  const validKeySingleMock = vi.fn().mockResolvedValue({
    data: {
      product_key: "test",
      max_tier: "guest",
      active: true,
      expires_at: null,
    },
  });
  const keySelectMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ single: validKeySingleMock }),
  });

  return {
    insertIssue,
    client: {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "panel_api_keys") {
          return { select: keySelectMock };
        }

        if (table === "panel_submissions") {
          return {
            update: vi.fn().mockImplementation(() => {
              submissionUpdateCount += 1;
              if (submissionUpdateCount === 1) {
                return {
                  eq: vi.fn().mockReturnValue({
                    in: vi.fn().mockReturnValue({
                      select: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: options.idempotencyAcquired === false ? null : { id: submission.id },
                          error: null,
                        }),
                      }),
                    }),
                  }),
                };
              }

              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
            select: vi.fn().mockImplementation((fields: string) => ({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data:
                    fields === "status"
                      ? { status: options.existingStatus ?? submission.status }
                      : submission,
                  error: null,
                }),
              }),
            })),
          };
        }

        if (table === "panel_issues") {
          return {
            insert: insertIssue,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: options.existingIssue ?? null,
                      error: null,
                    }),
                  }),
                }),
                single: vi.fn().mockResolvedValue({
                  data: options.existingIssue ?? null,
                  error: null,
                }),
              }),
            }),
          };
        }

        return {};
      }),
    } as unknown as SupabaseClient,
  };
}

function makeUnauthorizedSupabaseMock() {
  const nullSingleMock = vi.fn().mockResolvedValue({ data: null });
  const selectMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ single: nullSingleMock }),
  });
  return {
    from: vi.fn().mockReturnValue({ select: selectMock }),
  } as unknown as SupabaseClient;
}

function makeGitHubMock(issueNumber = 42) {
  const createMock = vi.fn().mockImplementation(({ owner, repo }: { owner: string; repo: string }) => ({
    data: {
      number: issueNumber,
      html_url: `https://github.com/${owner}/${repo}/issues/${issueNumber}`,
    },
  }));

  return {
    issues: {
      listLabelsForRepo: vi.fn().mockResolvedValue({
        data: [{ name: "bug", description: "A bug", color: "d73a4a" }],
      }),
      listForRepo: vi.fn().mockResolvedValue({ data: [] }),
      create: createMock,
    },
    createMock,
  } as const as unknown as {
    issues: {
      listLabelsForRepo: ReturnType<typeof vi.fn>;
      listForRepo: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    createMock: ReturnType<typeof vi.fn>;
  };
}

async function parseSSE(res: Response): Promise<Array<Record<string, unknown>>> {
  const text = await res.text();
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((chunk) => {
      const line = chunk.replace(/^data: /, "").trim();
      try {
        return JSON.parse(line) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

async function setupBamlMocks(overrides?: Partial<typeof MOCK_ISSUE_OUTPUT>) {
  const { b } = await import("baml_client");
  vi.mocked(b.ClassifyIssue).mockResolvedValue({
    category: "bug",
    severity: "high",
    labels: [{ name: "bug", reason: "It is a bug" }],
    requires_reproduction: true,
  });
  vi.mocked(b.EnrichWithRepoContext).mockResolvedValue({
    relevant_files: [],
    related_issues: [],
    suggested_assignee: null,
    reproduction_steps: [],
  });
  vi.mocked(b.FormatAsGitHubIssue).mockResolvedValue({
    ...MOCK_ISSUE_OUTPUT,
    ...overrides,
  });
  return b;
}

describe("POST /v1/panel/process/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without a valid internal secret", async () => {
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(makeUnauthorizedSupabaseMock());

    const req = new Request("https://panel-api.consiliency.io/v1/panel/process/abc", {
      method: "POST",
      headers: {
        authorization: "Bearer wrong-secret",
        "content-type": "application/json",
      },
      body: JSON.stringify({ repo: APP_REPO }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "abc" }) });
    expect(res.status).toBe(401);
  });

  it("proves the Panel-owned acceptance artifact for candidate handoff paths", async () => {
    const supabase = makeSupabaseMock();
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(supabase.client);
    vi.mocked(githubLib.parseRepo).mockImplementation((repo: string) => {
      const [owner, name] = repo.split("/");
      return { owner, repo: name };
    });
    const gh = makeGitHubMock();
    vi.mocked(githubLib.getGitHubClient).mockReturnValue(gh as never);

    await setupBamlMocks();

    const res = await POST(makeRequest("sub-abc"), {
      params: Promise.resolve({ id: "sub-abc" }),
    });

    expect(res.status).toBe(200);
    const events = await parseSSE(res);
    expect(events.map((event) => event.type)).toEqual([
      "routing",
      "progress",
      "progress",
      "progress",
      "progress",
      "progress",
      "pipeline_handoff",
      "completed",
    ]);

    const routingEvent = events.find((event) => event.type === "routing");
    expect(routingEvent).toMatchObject({
      target: "app",
      routingTarget: "host_app",
      targetRepo: APP_REPO,
    });

    const handoffEvent = events.find((event) => event.type === "pipeline_handoff");
    expect(handoffEvent).toMatchObject({
      target: "app",
      routingTarget: "host_app",
      targetRepo: APP_REPO,
      handoffStatus: "candidate",
      pipelineHint: "core workflow blocker",
    });
    expect(handoffEvent).not.toHaveProperty("transcript");
    expect(handoffEvent).not.toHaveProperty("console_errors");

    const createCall = gh.createMock.mock.calls[0][0] as {
      owner: string;
      repo: string;
      body: string;
      labels: string[];
    };
    expect(createCall.owner).toBe("Owner");
    expect(createCall.repo).toBe("app-repo");
    expect(createCall.body).toContain("## Summary");
    expect(createCall.body).toContain(MOCK_ISSUE_OUTPUT.issue_sections.summary);
    expect(createCall.body).toContain("## User-approved details");
    expect(createCall.body).toContain(MOCK_ISSUE_OUTPUT.issue_sections.user_approved_details);
    expect(createCall.body).toContain("## Environment");
    expect(createCall.body).toContain(MOCK_ISSUE_OUTPUT.issue_sections.environment);
    expect(createCall.body).toContain("## Routing");
    expect(createCall.body).toContain(MOCK_ISSUE_OUTPUT.issue_sections.routing);
    expect(createCall.body).toContain("## Pipeline intake handoff");
    expect(createCall.body).toContain(MOCK_ISSUE_OUTPUT.issue_sections.pipeline_intake_handoff);
    expect(createCall.body).toContain("## Linked evidence");
    expect(createCall.body).toContain(MOCK_ISSUE_OUTPUT.issue_sections.linked_evidence);
    expect(createCall.body).toContain("Tracking markers:");
    expect(createCall.body).toContain("- `panel_source`: panel");
    expect(createCall.body).toContain("- `panel_submission_id`: sub-abc");
    expect(createCall.body).toContain("- `panel_product_key`: test");
    expect(createCall.body).toContain("- `panel_target`: host_app");
    expect(createCall.body).toContain("- `panel_repo_decision`: app");
    expect(createCall.body).toContain("- `panel_intake_candidate`: candidate");
    expect(createCall.body).toContain("- `panel_screenshot_kinds`: page");
    expect(createCall.body).toContain("- `panel_summary_ref`: dashboard-submit");
    expect(createCall.body).toContain("- `panel_pipeline_hint`: core workflow blocker");
    expect(createCall.labels).toEqual(expect.arrayContaining([
      "source:panel",
      "target:host_app",
      "target:pipeline_intake",
      "pipeline-intake:candidate",
    ]));

    const persistedIssue = supabase.insertIssue.mock.calls[0][0] as {
      technical_details: PanelIssueTechnicalDetails;
      labels: string[];
    };
    expect(persistedIssue.technical_details.pipelineHandoff).toMatchObject({
      status: "candidate",
      repoDecision: "app",
      routingTarget: "host_app",
      targetRepo: APP_REPO,
    });
    expect(
      persistedIssue.technical_details.pipelineHandoff.forwardableMetadata,
    ).toMatchObject({
      page_url: "https://example.com/dashboard",
      page_title: "Dashboard",
      submission_timestamp: "2026-01-01T00:00:00Z",
      github_login: "alice",
      selected_model_id: "claude-sonnet",
      component_hint: "src/components/SubmitButton.tsx",
      screenshot_kinds: ["page"],
      navigation_summary: "Home (https://example.com) -> Dashboard (https://example.com/dashboard)",
      context_summary: "Dashboard submission is blocked for authenticated users.",
    });
    expect(
      persistedIssue.technical_details.pipelineHandoff.forwardableMetadata,
    ).not.toHaveProperty("transcript");
    expect(
      persistedIssue.technical_details.pipelineHandoff.forwardableMetadata,
    ).not.toHaveProperty("console_errors");
    expect(persistedIssue.technical_details.issueMarkers.panel_submission_id).toBe("sub-abc");
    expect(persistedIssue.labels).toEqual(createCall.labels);
  });

  it("persists the deferred acceptance artifact without emitting pipeline_handoff", async () => {
    const supabase = makeSupabaseMock();
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(supabase.client);
    vi.mocked(githubLib.parseRepo).mockImplementation((repo: string) => {
      const [owner, name] = repo.split("/");
      return { owner, repo: name };
    });
    const gh = makeGitHubMock();
    vi.mocked(githubLib.getGitHubClient).mockReturnValue(gh as never);

    await setupBamlMocks({
      pipeline_handoff: {
        status: "deferred",
        pipeline_hint: "Needs human triage first",
        forwardable_metadata_summary: "Keep as issue metadata only for now.",
      },
      issue_markers: {
        ...MOCK_ISSUE_OUTPUT.issue_markers,
        panel_intake_candidate: "deferred",
        panel_pipeline_hint: "Needs human triage first",
      },
    });

    const res = await POST(makeRequest("sub-abc"), {
      params: Promise.resolve({ id: "sub-abc" }),
    });

    const events = await parseSSE(res);
    expect(events.some((event) => event.type === "pipeline_handoff")).toBe(false);

    const createCall = gh.createMock.mock.calls[0][0] as { labels: string[] };
    expect(createCall.labels).toContain("pipeline-intake:deferred");
    expect(createCall.labels).not.toContain("target:pipeline_intake");

    const persistedIssue = supabase.insertIssue.mock.calls[0][0] as {
      technical_details: PanelIssueTechnicalDetails;
    };
    expect(persistedIssue.technical_details.pipelineHandoff.status).toBe("deferred");
    expect(persistedIssue.technical_details.issueMarkers.panel_intake_candidate).toBe("deferred");
    expect(persistedIssue.technical_details.pipelineHandoff.pipelineHint).toBe(
      "Needs human triage first",
    );
    expect(persistedIssue.technical_details.pipelineHandoff.forwardableMetadata).toMatchObject({
      page_url: "https://example.com/dashboard",
      page_title: "Dashboard",
    });
  });

  it("replays stored candidate handoff metadata for completed submissions", async () => {
    const technicalDetails: PanelIssueTechnicalDetails = {
      priority: "high",
      rawSummary: "Relevant file: src/components/SubmitButton.tsx",
      issueSections: MOCK_ISSUE_OUTPUT.issue_sections,
      issueMarkers: {
        panel_source: "panel",
        panel_submission_id: "sub-abc",
        panel_product_key: "test",
        panel_target: "host_app",
        panel_repo_decision: "app",
        panel_intake_candidate: "candidate",
        panel_screenshot_kinds: "page",
        panel_summary_ref: "dashboard-submit",
        panel_pipeline_hint: "core workflow blocker",
      },
      pipelineHandoff: {
        status: "candidate",
        repoDecision: "app",
        routingTarget: "host_app",
        targetRepo: APP_REPO,
        issueLabels: [
          "source:panel",
          "target:host_app",
          "target:pipeline_intake",
          "pipeline-intake:candidate",
        ],
        trackingMarkers: {
          panel_source: "panel",
          panel_submission_id: "sub-abc",
        },
        forwardableMetadata: {
          page_url: "https://example.com/dashboard",
          page_title: "Dashboard",
          submission_timestamp: "2026-01-01T00:00:00Z",
        },
        pipelineHint: "core workflow blocker",
      },
    };
    const supabase = makeSupabaseMock({
      idempotencyAcquired: false,
      existingStatus: "completed",
      existingIssue: {
        github_issue_url: "https://github.com/Owner/app-repo/issues/42",
        github_issue_number: 42,
        plain_summary: MOCK_ISSUE_OUTPUT.plain_summary,
        technical_details: technicalDetails,
      },
    });
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(supabase.client);

    const gh = makeGitHubMock();
    vi.mocked(githubLib.getGitHubClient).mockReturnValue(gh as never);

    const b = await setupBamlMocks();

    const res = await POST(makeRequest("sub-abc"), {
      params: Promise.resolve({ id: "sub-abc" }),
    });

    const events = await parseSSE(res);
    expect(events.map((event) => event.type)).toEqual([
      "pipeline_handoff",
      "completed",
    ]);
    expect(events[0]).toMatchObject({
      target: "app",
      routingTarget: "host_app",
      handoffStatus: "candidate",
      targetRepo: APP_REPO,
    });

    expect(vi.mocked(b.ClassifyIssue)).not.toHaveBeenCalled();
    expect(gh.createMock).not.toHaveBeenCalled();
  });

  it("preserves panelRepo routing and passes screenshot hints to RouteToRepo", async () => {
    const submissionWithScreenshots = {
      ...MOCK_SUBMISSION,
      attachment_urls: [
        {
          url: "https://storage.example.com/page.png",
          type: "screenshot",
          name: "screenshot-page-1735689600000.png",
        },
        {
          url: "https://storage.example.com/panel.png",
          type: "screenshot",
          name: "screenshot-panel-1735689601000.png",
        },
        {
          url: "https://storage.example.com/file.pdf",
          type: "file",
          name: "report.pdf",
        },
      ],
    };
    const supabase = makeSupabaseMock({ submission: submissionWithScreenshots });
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(supabase.client);
    vi.mocked(githubLib.parseRepo).mockImplementation((repo: string) => {
      const [owner, name] = repo.split("/");
      return { owner, repo: name };
    });
    const gh = makeGitHubMock(7);
    vi.mocked(githubLib.getGitHubClient).mockReturnValue(gh as never);

    const b = await setupBamlMocks({
      issue_sections: {
        ...MOCK_ISSUE_OUTPUT.issue_sections,
        routing: "This issue belongs in the panel widget repository.",
      },
      issue_markers: {
        ...MOCK_ISSUE_OUTPUT.issue_markers,
        panel_target: "panel_widget",
        panel_repo_decision: "panel",
      },
    });
    vi.mocked(b.RouteToRepo).mockResolvedValue({
      target: "panel",
      reasoning: "Widget UI bug",
      confidence: "high",
    });

    const res = await POST(
      makeRequest("sub-abc", { repo: APP_REPO, panelRepo: PANEL_REPO }),
      { params: Promise.resolve({ id: "sub-abc" }) },
    );

    const events = await parseSSE(res);
    const routingEvent = events.find((event) => event.type === "routing");
    expect(routingEvent).toMatchObject({
      target: "panel",
      routingTarget: "panel_widget",
      targetRepo: PANEL_REPO,
    });

    const createCall = gh.createMock.mock.calls[0][0] as { owner: string; repo: string };
    expect(createCall.owner).toBe("Consiliency");
    expect(createCall.repo).toBe("consiliency-panel");

    expect(vi.mocked(b.RouteToRepo)).toHaveBeenCalledOnce();
    const [, , screenshotKinds] = vi.mocked(b.RouteToRepo).mock.calls[0];
    expect(screenshotKinds).toEqual(["page", "panel"]);
  });
});
