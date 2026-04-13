import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../app/v1/panel/submit/route";
import type { SubmissionPayload } from "@consiliency/panel-types";

vi.mock("../../lib/ratelimit", () => ({
  isRateLimited: vi.fn().mockResolvedValue(false),
  tooManyRequests: () => Response.json({ error: "Too many requests" }, { status: 429 }),
}));

vi.mock("../../lib/auth", () => ({
  validateApiKey: vi.fn(),
  resolveUserTier: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("../../lib/supabase", () => ({
  getServiceSupabase: vi.fn(),
}));

// Mock next/server's after() so it's a no-op in tests
vi.mock("next/server", () => ({
  after: vi.fn((fn: () => Promise<void>) => {
    // Do not await — just ignore background work in tests
    void fn().catch(() => {});
  }),
}));

import * as auth from "../../lib/auth";
import * as supabaseLib from "../../lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

const mockValidateApiKey = vi.mocked(auth.validateApiKey);

function makeSupabaseMock(insertResult: { data: unknown; error: unknown }) {
  const selectMock = vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue(insertResult),
  });
  const insertMock = vi.fn().mockReturnValue({ select: selectMock });
  return {
    from: vi.fn().mockReturnValue({ insert: insertMock }),
  } as unknown as SupabaseClient;
}

const VALID_PAYLOAD: SubmissionPayload = {
  repo: "Consiliency/consiliency-portal",
  transcript: [
    { role: "assistant", content: "What happened?", timestamp: "2026-01-01T00:00:00Z" },
    { role: "user", content: "The button is broken", timestamp: "2026-01-01T00:00:01Z" },
  ],
  metadata: {
    url: "https://portal.consiliency.io/dashboard",
    title: "Dashboard",
    userAgent: "Mozilla/5.0",
    viewport: { width: 1440, height: 900 },
    timestamp: "2026-01-01T00:00:00Z",
    referrer: "",
  },
};

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://panel-api.consiliency.io/v1/panel/submit", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /v1/panel/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 with no key", async () => {
    mockValidateApiKey.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_PAYLOAD));
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid JSON body", async () => {
    mockValidateApiKey.mockResolvedValue({ productKey: "test", maxTier: "guest" });
    const req = new Request("https://panel-api.consiliency.io/v1/panel/submit", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer key" },
      body: "not-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 202 with submission id on valid payload", async () => {
    mockValidateApiKey.mockResolvedValue({ productKey: "test", maxTier: "guest" });
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(
      makeSupabaseMock({ data: { id: "sub-abc-123" }, error: null })
    );

    const res = await POST(makeRequest(VALID_PAYLOAD, { authorization: "Bearer valid-key" }));
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.id).toBe("sub-abc-123");
  });

  it("returns 500 when Supabase insert fails", async () => {
    mockValidateApiKey.mockResolvedValue({ productKey: "test", maxTier: "guest" });
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(
      makeSupabaseMock({ data: null, error: { message: "DB error" } })
    );

    const res = await POST(makeRequest(VALID_PAYLOAD, { authorization: "Bearer valid-key" }));
    expect(res.status).toBe(500);
  });
});
