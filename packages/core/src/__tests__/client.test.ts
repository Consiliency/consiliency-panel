import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PanelApiClient } from "../client";
import type { SubmissionPayload } from "@consiliency/panel-types";

const API_URL = "https://panel-api.consiliency.io";
const API_KEY = "test-api-key";

const VALID_PAYLOAD: SubmissionPayload = {
  repo: "Consiliency/consiliency-portal",
  transcript: [
    { role: "user", content: "Button broken", timestamp: "2026-01-01T00:00:00Z" },
  ],
  metadata: {
    url: "https://portal.consiliency.io",
    title: "Portal",
    userAgent: "Mozilla/5.0",
    viewport: { width: 1440, height: 900 },
    timestamp: "2026-01-01T00:00:00Z",
    referrer: "",
  },
};

describe("PanelApiClient", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let client: PanelApiClient;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    client = new PanelApiClient({ apiUrl: API_URL, apiKey: API_KEY });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getCapabilities()", () => {
    it("sends GET with correct auth header", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ tier: "guest", modes: ["feedback"] }), { status: 200 })
      );
      const result = await client.getCapabilities();
      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${API_URL}/v1/panel/capabilities`);
      expect((opts?.headers as Record<string, string>)?.["Authorization"]).toBe(`Bearer ${API_KEY}`);
      expect(result.tier).toBe("guest");
    });

    it("throws on non-ok response", async () => {
      fetchSpy.mockResolvedValueOnce(new Response("{}", { status: 401 }));
      await expect(client.getCapabilities()).rejects.toThrow();
    });
  });

  describe("submit()", () => {
    it("sends POST with correct shape", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "sub-xyz" }), { status: 202 })
      );
      const result = await client.submit(VALID_PAYLOAD);
      expect(result.id).toBe("sub-xyz");

      const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${API_URL}/v1/panel/submit`);
      expect(opts?.method).toBe("POST");

      const body = JSON.parse(opts?.body as string) as SubmissionPayload;
      expect(body.repo).toBe("Consiliency/consiliency-portal");
      expect(Array.isArray(body.transcript)).toBe(true);
      expect(body.metadata.viewport.width).toBe(1440);
    });

    it("throws on server error", async () => {
      fetchSpy.mockResolvedValueOnce(new Response("{}", { status: 500 }));
      await expect(client.submit(VALID_PAYLOAD)).rejects.toThrow();
    });
  });

  describe("streamProcess()", () => {
    it("emits events from SSE stream and resolves on complete", async () => {
      const sseBody = [
        `data: ${JSON.stringify({ type: "progress", message: "Classifying…" })}`,
        `data: ${JSON.stringify({ type: "complete", message: "Done", issueUrl: "https://github.com/issues/1", issueNumber: 1 })}`,
        "",
      ].join("\n\n");

      fetchSpy.mockResolvedValueOnce(
        new Response(sseBody, {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        })
      );

      const events: Array<{ type: string }> = [];
      await client.streamProcess("sub-xyz", (e) => events.push(e));

      expect(events.map((e) => e.type)).toEqual(["progress", "complete"]);
    });
  });
});
