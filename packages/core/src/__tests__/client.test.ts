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
    function makeSseResponse(events: object[]): Response {
      const body = events
        .map((e) => `data: ${JSON.stringify(e)}`)
        .join("\n\n") + "\n\n";
      return new Response(body, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      });
    }

    it("emits events from SSE stream using 'completed' event type", async () => {
      fetchSpy.mockResolvedValueOnce(makeSseResponse([
        { type: "progress", message: "Classifying…" },
        { type: "completed", issueUrl: "https://github.com/issues/1", issueNumber: 1 },
      ]));

      const events: Array<{ type: string }> = [];
      await client.streamProcess("sub-xyz", (e) => events.push(e), { repo: "Owner/repo" });

      expect(events.map((e) => e.type)).toEqual(["progress", "completed"]);
    });

    it("sends repo and panelRepo in POST body", async () => {
      fetchSpy.mockResolvedValueOnce(makeSseResponse([
        { type: "completed", issueUrl: "https://github.com/issues/2", issueNumber: 2 },
      ]));

      await client.streamProcess(
        "sub-xyz",
        () => {},
        { repo: "Owner/app-repo", panelRepo: "Owner/panel-repo" }
      );

      const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${API_URL}/v1/panel/process/sub-xyz`);
      expect(opts?.method).toBe("POST");
      const body = JSON.parse(opts?.body as string) as { repo: string; panelRepo?: string };
      expect(body.repo).toBe("Owner/app-repo");
      expect(body.panelRepo).toBe("Owner/panel-repo");
    });

    it("sends empty repo when options omitted (backwards compat)", async () => {
      fetchSpy.mockResolvedValueOnce(makeSseResponse([
        { type: "completed", issueUrl: "https://github.com/issues/3", issueNumber: 3 },
      ]));

      await client.streamProcess("sub-xyz", () => {});

      const [, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(opts?.body as string) as { repo: string };
      expect(body.repo).toBe("");
    });

    it("flushes final event from buffer when stream ends without trailing newline", async () => {
      const body = `data: ${JSON.stringify({ type: "progress", message: "Working…" })}\n\ndata: ${JSON.stringify({ type: "completed", issueUrl: "https://github.com/issues/99", issueNumber: 99 })}`;
      fetchSpy.mockResolvedValueOnce(new Response(body, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      }));

      const events: Array<{ type: string }> = [];
      await client.streamProcess("sub-xyz", (e) => events.push(e), { repo: "Owner/repo" });

      expect(events.map((e) => e.type)).toEqual(["progress", "completed"]);
    });

    it("throws on non-ok response", async () => {
      fetchSpy.mockResolvedValueOnce(new Response("{}", { status: 500 }));
      await expect(client.streamProcess("sub-xyz", () => {})).rejects.toThrow("Process stream failed: 500");
    });

    it("emits error events from SSE stream", async () => {
      fetchSpy.mockResolvedValueOnce(makeSseResponse([
        { type: "progress", message: "Classifying…" },
        { type: "error", message: "Pipeline failed" },
      ]));

      const events: Array<{ type: string; message?: string }> = [];
      await client.streamProcess("sub-xyz", (e) => events.push(e), { repo: "Owner/repo" });

      expect(events.map((e) => e.type)).toEqual(["progress", "error"]);
      expect(events[1]?.message).toBe("Pipeline failed");
    });
  });

  describe("githubLogin headers", () => {
    it("uses static githubLogin in headers", async () => {
      const c = new PanelApiClient({ apiUrl: API_URL, apiKey: API_KEY, githubLogin: "alice" });
      fetchSpy.mockResolvedValueOnce(new Response("{}", { status: 200 }));
      await c.getCapabilities();
      const [, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((opts?.headers as Record<string, string>)["x-github-login"]).toBe("alice");
    });

    it("reads from githubLoginGetter on each request (resolver path)", async () => {
      let login: string | undefined = undefined;
      const c = new PanelApiClient({ apiUrl: API_URL, apiKey: API_KEY, githubLoginGetter: () => login });
      fetchSpy.mockResolvedValueOnce(new Response("{}", { status: 200 }));
      await c.getCapabilities();
      let headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
      expect(headers["x-github-login"]).toBeUndefined();

      login = "bob";
      fetchSpy.mockResolvedValueOnce(new Response("{}", { status: 200 }));
      await c.getCapabilities();
      headers = fetchSpy.mock.calls[1][1].headers as Record<string, string>;
      expect(headers["x-github-login"]).toBe("bob");
    });
  });
});
