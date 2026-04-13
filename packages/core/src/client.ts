import type {
  CapabilitiesResponse,
  PanelApiClientConfig,
  ProcessEvent,
  RepoContext,
  SubmissionPayload,
} from "@consiliency/panel-types";

export class PanelApiClient {
  private apiUrl: string;
  private apiKey: string;

  constructor({ apiUrl, apiKey }: PanelApiClientConfig) {
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async getCapabilities(): Promise<CapabilitiesResponse> {
    const res = await fetch(`${this.apiUrl}/v1/panel/capabilities`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Capabilities fetch failed: ${res.status}`);
    return res.json() as Promise<CapabilitiesResponse>;
  }

  async getRepoContext(params: {
    repo: string;
    query: string;
    files?: string[];
  }): Promise<RepoContext> {
    const res = await fetch(`${this.apiUrl}/v1/panel/repo-context`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Repo context fetch failed: ${res.status}`);
    return res.json() as Promise<RepoContext>;
  }

  /** Get a signed upload URL, upload directly to Supabase storage, return storage URL */
  async uploadAttachment(blob: Blob, filename: string): Promise<string> {
    // 1. Get signed URL from backend
    const signRes = await fetch(`${this.apiUrl}/v1/panel/upload-url`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ filename, contentType: blob.type }),
    });
    if (!signRes.ok) throw new Error(`Failed to get upload URL: ${signRes.status}`);
    const { uploadUrl, storageUrl } = (await signRes.json()) as {
      uploadUrl: string;
      storageUrl: string;
    };

    // 2. Upload directly to Supabase (bypasses Next.js body size limit)
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": blob.type },
    });
    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

    return storageUrl;
  }

  async submit(payload: SubmissionPayload): Promise<{ id: string }> {
    const res = await fetch(`${this.apiUrl}/v1/panel/submit`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Submit failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<{ id: string }>;
  }

  async streamProcess(
    id: string,
    onEvent: (event: ProcessEvent) => void
  ): Promise<void> {
    const res = await fetch(`${this.apiUrl}/v1/panel/process/${id}`, {
      method: "POST",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Process stream failed: ${res.status}`);
    if (!res.body) throw new Error("Response body is null");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Parse SSE lines
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const event = JSON.parse(line.slice(6)) as ProcessEvent;
            onEvent(event);
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    }
  }
}
