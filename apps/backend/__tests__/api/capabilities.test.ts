import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockValidateApiKey, mockResolveUserTier, mockIsRateLimited } = vi.hoisted(() => ({
  mockValidateApiKey: vi.fn(),
  mockResolveUserTier: vi.fn(),
  mockIsRateLimited: vi.fn(),
}));

vi.mock("../../lib/ratelimit", () => ({
  isRateLimited: mockIsRateLimited,
  tooManyRequests: () => Response.json({ error: "Too many requests" }, { status: 429 }),
}));

vi.mock("../../lib/auth", () => ({
  validateApiKey: mockValidateApiKey,
  resolveUserTier: mockResolveUserTier,
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://panel-api.consiliency.io/v1/panel/capabilities", { headers });
}

async function loadRoute() {
  return import("../../app/v1/panel/capabilities/route");
}

describe("GET /v1/panel/capabilities", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.PANEL_ALLOWED_ORIGINS;
    mockIsRateLimited.mockResolvedValue(false);
  });

  afterEach(() => {
    delete process.env.PANEL_ALLOWED_ORIGINS;
  });

  it("returns 401 with no Authorization header", async () => {
    mockValidateApiKey.mockResolvedValue(null);
    const { GET } = await loadRoute();
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 with invalid key and reflects an allowed origin", async () => {
    process.env.PANEL_ALLOWED_ORIGINS = "https://app.example.com";
    mockValidateApiKey.mockResolvedValue(null);
    const { GET } = await loadRoute();
    const res = await GET(makeRequest({
      authorization: "Bearer bad-key",
      origin: "https://app.example.com",
    }));
    expect(res.status).toBe(401);
    expect(res.headers.get("access-control-allow-origin")).toBe("https://app.example.com");
  });

  it("returns 200 with tier and modes for valid guest key", async () => {
    mockValidateApiKey.mockResolvedValue({ productKey: "test-product", maxTier: "guest" });
    const { GET } = await loadRoute();
    const res = await GET(makeRequest({ authorization: "Bearer valid-key" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe("guest");
    expect(Array.isArray(body.modes)).toBe(true);
    expect(body.modes).toContain("feedback");
  });

  it("returns team tier for valid team key", async () => {
    mockValidateApiKey.mockResolvedValue({ productKey: "test-product", maxTier: "team" });
    const { GET } = await loadRoute();
    const res = await GET(makeRequest({ authorization: "Bearer team-key" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe("team");
  });

  it("resolves per-user tier when x-github-login header is present", async () => {
    mockValidateApiKey.mockResolvedValue({ productKey: "test-product", maxTier: "team" });
    mockResolveUserTier.mockResolvedValue("contractor");
    const { GET } = await loadRoute();
    const res = await GET(
      makeRequest({ authorization: "Bearer team-key", "x-github-login": "octocat" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe("contractor");
    expect(mockResolveUserTier).toHaveBeenCalledWith("octocat", "test-product", "team");
  });

  it("returns 429 only after successful key validation", async () => {
    mockValidateApiKey.mockResolvedValue({ productKey: "test-product", maxTier: "guest" });
    mockIsRateLimited.mockResolvedValue(true);
    const { GET } = await loadRoute();
    const res = await GET(makeRequest({ authorization: "Bearer valid-key" }));
    expect(res.status).toBe(429);
    expect(mockIsRateLimited).toHaveBeenCalledWith("test-product");
  });

  it("returns no CORS headers for a disallowed origin even when the key is valid", async () => {
    process.env.PANEL_ALLOWED_ORIGINS = "https://allowed.example.com";
    mockValidateApiKey.mockResolvedValue({ productKey: "test-product", maxTier: "guest" });
    const { GET } = await loadRoute();
    const res = await GET(makeRequest({
      authorization: "Bearer valid-key",
      origin: "https://blocked.example.com",
    }));
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});
