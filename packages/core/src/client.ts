import type {
  CapabilitiesResponse,
  ConversationTurn,
  IssueDraft,
  KnownFacts,
  NextTurnRequest,
  NextTurnResponse,
  PanelApiClientConfig,
  ProcessEvent,
  RepoContext,
  SubmissionPayload,
  ToolCall,
} from "@consiliency/panel-types";

export class PanelApiClient {
  private apiUrl: string;
  private apiKey: string;
  private githubLoginGetter: () => string | undefined;

  constructor({
    apiUrl,
    apiKey,
    githubLogin,
    githubLoginGetter,
  }: PanelApiClientConfig & {
    githubLogin?: string;
    /** Dynamic getter — used when the login is resolved asynchronously after construction */
    githubLoginGetter?: () => string | undefined;
  }) {
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.githubLoginGetter = githubLoginGetter ?? (() => githubLogin);
  }

  private headers(): HeadersInit {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
    const login = this.githubLoginGetter();
    if (login) h["x-github-login"] = login;
    return h;
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

  async nextTurn(req: NextTurnRequest): Promise<NextTurnResponse> {
    const res = await fetch(`${this.apiUrl}/v1/panel/next-turn`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`nextTurn failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<NextTurnResponse>;
  }

  async patchDraft(id: string, draft: IssueDraft): Promise<void> {
    const res = await fetch(`${this.apiUrl}/v1/panel/draft/${id}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify({ draft }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`patchDraft failed (${res.status}): ${text}`);
    }
  }

  async nextCommentTurn(req: {
    submissionId: string;
    issueNumber: number;
    issueUrl: string;
    issueBody: string;
    userText: string;
    transcript: ConversationTurn[];
    knownFacts?: KnownFacts;
    selectedModelId?: string;
    repo: string;
    panelRepo?: string;
  }): Promise<{ draftId: string; toolCall: ToolCall; knownFacts: KnownFacts }> {
    const res = await fetch(`${this.apiUrl}/v1/panel/comment-next-turn`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`nextCommentTurn failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<{
      draftId: string;
      toolCall: ToolCall;
      knownFacts: KnownFacts;
    }>;
  }

  async postComment(submissionId: string, body: string): Promise<{ commentUrl: string }> {
    const res = await fetch(`${this.apiUrl}/v1/panel/comment`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ submissionId, body }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`postComment failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<{ commentUrl: string }>;
  }

  async submit(payload: SubmissionPayload): Promise<{ id: string }> {
    const res = await fetch(`${this.apiUrl}/v1/panel/submit`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    if (res.status === 422) {
      const data = (await res.json()) as { reason?: string; error?: string; requiresConfirm?: boolean };
      const err = new Error(data.reason ?? data.error ?? "Draft not ready") as Error & {
        status: number;
        requiresConfirm: boolean;
        reason: string;
      };
      err.status = 422;
      err.requiresConfirm = Boolean(data.requiresConfirm);
      err.reason = data.reason ?? data.error ?? "Draft not ready";
      throw err;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Submit failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<{ id: string }>;
  }

  async streamProcess(
    id: string,
    onEvent: (event: ProcessEvent) => void,
    options?: { repo: string; panelRepo?: string }
  ): Promise<void> {
    const res = await fetch(`${this.apiUrl}/v1/panel/process/${id}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ repo: options?.repo ?? "", panelRepo: options?.panelRepo }),
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

    // Flush any remaining buffered data (e.g. final "completed" event)
    if (buffer.trim()) {
      for (const line of buffer.split("\n")) {
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
