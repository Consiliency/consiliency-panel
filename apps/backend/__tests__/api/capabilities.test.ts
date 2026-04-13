import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../app/v1/panel/capabilities/route";

vi.mock("../../lib/ratelimit", () => ({
  isRateLimited: vi.fn().mockResolvedValue(false),
  tooManyRequests: () => Response.json({ error: "Too many requests" }, { status: 429 }),
}));

// Mock the auth module so we control what validateApiKey returns
vi.mock("../../lib/auth", () => ({
  validateApiKey: vi.fn(),
  resolveUserTier: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

import * as auth from "../../lib/auth";

const mockValidateApiKey = vi.mocked(auth.validateApiKey);
const mockResolveUserTier = vi.mocked(auth.resolveUserTier);

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://panel-api.consiliency.io/v1/panel/capabilities", { headers });
}

describe("GET /v1/panel/capabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 with no Authorization header", async () => {
    mockValidateApiKey.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 with invalid key", async () => {
    mockValidateApiKey.mockResolvedValue(null);
    const res = await GET(makeRequest({ authorization: "Bearer bad-key" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 with tier and modes for valid guest key", async () => {
    mockValidateApiKey.mockResolvedValue({ productKey: "test-product", maxTier: "guest" });
    const res = await GET(makeRequest({ authorization: "Bearer valid-key" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe("guest");
    expect(Array.isArray(body.modes)).toBe(true);
    expect(body.modes).toContain("feedback");
  });

  it("returns team tier for valid team key", async () => {
    mockValidateApiKey.mockResolvedValue({ productKey: "test-product", maxTier: "team" });
    const res = await GET(makeRequest({ authorization: "Bearer team-key" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe("team");
  });

  it("resolves per-user tier when x-github-login header is present", async () => {
    mockValidateApiKey.mockResolvedValue({ productKey: "test-product", maxTier: "team" });
    mockResolveUserTier.mockResolvedValue("contractor");
    const res = await GET(
      makeRequest({ authorization: "Bearer team-key", "x-github-login": "octocat" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe("contractor");
    expect(mockResolveUserTier).toHaveBeenCalledWith("octocat", "test-product", "team");
  });
});
