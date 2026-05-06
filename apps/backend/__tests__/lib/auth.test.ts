import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/supabase", () => ({
  getServiceSupabase: vi.fn(),
}));

import { resolveUserTier, validateApiKey } from "../../lib/auth";
import * as supabaseLib from "../../lib/supabase";

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://panel-api.consiliency.io/v1/panel/capabilities", { headers });
}

function makeApiKeyClient(data: unknown) {
  const single = vi.fn().mockResolvedValue({ data });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  return {
    client: { from: vi.fn().mockReturnValue({ select }) },
    eq,
  };
}

function makeUserRoleClient(data: unknown) {
  const single = vi.fn().mockResolvedValue({ data });
  const secondEq = vi.fn().mockReturnValue({ single });
  const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
  const select = vi.fn().mockReturnValue({ eq: firstEq });
  return {
    client: { from: vi.fn().mockReturnValue({ select }) },
    firstEq,
    secondEq,
  };
}

describe("auth helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when the Authorization header is missing", async () => {
    const res = await validateApiKey(makeRequest());
    expect(res).toBeNull();
  });

  it("returns null for a disabled API key row", async () => {
    const { client, eq } = makeApiKeyClient({
      product_key: "panel-product",
      max_tier: "team",
      active: false,
      expires_at: null,
    });
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(client as never);

    const res = await validateApiKey(makeRequest({ authorization: "Bearer disabled-key" }));

    expect(res).toBeNull();
    expect(eq).toHaveBeenCalledWith("key_hash", expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(eq).not.toHaveBeenCalledWith("key_hash", "disabled-key");
  });

  it("returns null for an expired API key row", async () => {
    const { client } = makeApiKeyClient({
      product_key: "panel-product",
      max_tier: "team",
      active: true,
      expires_at: "2000-01-01T00:00:00Z",
    });
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(client as never);

    const res = await validateApiKey(makeRequest({ authorization: "Bearer expired-key" }));

    expect(res).toBeNull();
  });

  it("returns the scoped product key and max tier for an active API key", async () => {
    const { client } = makeApiKeyClient({
      product_key: "panel-product",
      max_tier: "contractor",
      active: true,
      expires_at: null,
    });
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(client as never);

    const res = await validateApiKey(makeRequest({ authorization: "Bearer live-key" }));

    expect(res).toEqual({ productKey: "panel-product", maxTier: "contractor" });
  });

  it("defaults user tier to guest when no role row exists", async () => {
    const { client } = makeUserRoleClient(null);
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(client as never);

    const tier = await resolveUserTier("octocat", "panel-product", "team");

    expect(tier).toBe("guest");
  });

  it("clamps the resolved user tier to the key max tier", async () => {
    const { client, firstEq, secondEq } = makeUserRoleClient({
      role: "team",
      expires_at: null,
    });
    vi.mocked(supabaseLib.getServiceSupabase).mockReturnValue(client as never);

    const tier = await resolveUserTier("octocat", "panel-product", "contractor");

    expect(firstEq).toHaveBeenCalledWith("github_login", "octocat");
    expect(secondEq).toHaveBeenCalledWith("product_key", "panel-product");
    expect(tier).toBe("contractor");
  });
});
