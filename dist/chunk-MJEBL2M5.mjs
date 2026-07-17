import {
  __publicField
} from "./chunk-NSSMTXJJ.mjs";

// src/PanelProvider.tsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

// ../core/src/metadata.ts
var MetadataCollector = class {
  constructor() {
    __publicField(this, "consoleErrorBuffer", []);
    __publicField(this, "consoleWarningBuffer", []);
    __publicField(this, "originalConsoleError");
    __publicField(this, "originalConsoleWarn");
    __publicField(this, "originalOnError", null);
    this.originalConsoleError = console.error.bind(console);
    console.error = (...args) => {
      this.consoleErrorBuffer.push(args.map(String).join(" "));
      this.originalConsoleError(...args);
    };
    this.originalConsoleWarn = console.warn.bind(console);
    console.warn = (...args) => {
      this.consoleWarningBuffer.push(args.map(String).join(" "));
      this.originalConsoleWarn(...args);
    };
    if (typeof window !== "undefined") {
      this.originalOnError = window.onerror;
      window.onerror = (msg, src, line, col, err) => {
        this.consoleErrorBuffer.push(
          `Uncaught ${err?.name ?? "Error"}: ${msg} (${src}:${line}:${col})`
        );
        return this.originalOnError?.(msg, src, line, col, err) ?? false;
      };
    }
  }
  collect() {
    return {
      url: typeof window !== "undefined" ? window.location.href : "",
      title: typeof document !== "undefined" ? document.title : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      viewport: typeof window !== "undefined" ? { width: window.innerWidth, height: window.innerHeight } : { width: 0, height: 0 },
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      referrer: typeof document !== "undefined" ? document.referrer : ""
    };
  }
  collectConsoleErrors() {
    return [...this.consoleErrorBuffer];
  }
  flushConsoleErrors() {
    const errors = [...this.consoleErrorBuffer];
    this.consoleErrorBuffer = [];
    return errors;
  }
  collectConsoleWarnings() {
    return [...this.consoleWarningBuffer];
  }
  flushConsoleWarnings() {
    const warnings = [...this.consoleWarningBuffer];
    this.consoleWarningBuffer = [];
    return warnings;
  }
  destroy() {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    if (typeof window !== "undefined" && this.originalOnError !== null) {
      window.onerror = this.originalOnError;
    }
  }
};

// ../core/src/capture.ts
async function captureScreenshot(opts = {}) {
  const { domToBlob } = await import("./dist-7N3R6H2Z.mjs");
  const { panelEl } = opts;
  const pagePromise = domToBlob(document.documentElement, {
    quality: 0.9,
    type: "image/png",
    timeout: 1e4,
    filter: panelEl ? (node) => node !== panelEl : void 0
  });
  if (!panelEl) {
    const page2 = await pagePromise;
    if (!page2) throw new Error("Screenshot capture returned empty blob");
    return { page: page2 };
  }
  const panelPromise = domToBlob(panelEl, {
    quality: 0.9,
    type: "image/png",
    timeout: 1e4
  });
  const [pageResult, panelResult] = await Promise.allSettled([pagePromise, panelPromise]);
  const page = pageResult.status === "fulfilled" ? pageResult.value : null;
  const panel = panelResult.status === "fulfilled" ? panelResult.value : null;
  if (!page && !panel) {
    throw new Error("Screenshot capture: both page and panel captures failed");
  }
  return {
    page: page ?? panel,
    panel: panel ?? void 0
  };
}
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ../core/src/voice.ts
var VoiceInput = class _VoiceInput {
  constructor() {
    __publicField(this, "recognition", null);
    __publicField(this, "resolveStop", null);
    __publicField(this, "accumulated", "");
    __publicField(this, "onInterim", null);
  }
  static isSupported() {
    if (typeof window === "undefined") return false;
    const w = window;
    return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
  }
  start() {
    if (!_VoiceInput.isSupported()) {
      throw new Error("Web Speech API not supported in this browser");
    }
    const w = window;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.accumulated = "";
    this.recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      if (final) this.accumulated += final;
      this.onInterim?.(this.accumulated + interim);
    };
    this.recognition.start();
  }
  stop() {
    return new Promise((resolve) => {
      this.resolveStop = resolve;
      if (this.recognition) {
        this.recognition.onend = () => {
          resolve(this.accumulated.trim());
          this.resolveStop = null;
        };
        this.recognition.stop();
      } else {
        resolve("");
      }
    });
  }
  abort() {
    this.recognition?.abort();
    this.resolveStop?.("");
    this.resolveStop = null;
    this.accumulated = "";
  }
};

// ../core/src/conversation.ts
var ConversationEngine = class {
  constructor(registry) {
    __publicField(this, "registry");
    __publicField(this, "metadata", null);
    __publicField(this, "client", null);
    __publicField(this, "context", null);
    __publicField(this, "savedSessions", []);
    __publicField(this, "currentSessionId", makeSessionId());
    __publicField(this, "currentModeId", null);
    __publicField(this, "state", {
      turns: [],
      phase: "greeting",
      questionIndex: 0
    });
    __publicField(this, "commentIssueBody");
    __publicField(this, "commentDraftBody");
    this.registry = registry;
  }
  setMetadata(metadata) {
    this.metadata = metadata;
  }
  setClient(client) {
    this.client = client;
  }
  setContext(context) {
    this.context = context;
  }
  setSelectedModelId(id) {
    this.state = { ...this.state, selectedModelId: id };
  }
  setSubmissionId(id) {
    this.state = { ...this.state, submissionId: id };
  }
  setScreenshotUrl(url) {
    this.state = { ...this.state, screenshotUrl: url };
  }
  addAttachment(ref) {
    this.state = {
      ...this.state,
      attachmentUrls: [...this.state.attachmentUrls ?? [], ref]
    };
  }
  async start(modeId) {
    const mode = this.registry.get(modeId);
    this.currentModeId = modeId;
    const greeting = {
      role: "assistant",
      content: `I'll help you submit feedback. ${mode.questions[0]?.text ?? "What would you like to report?"}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      kind: "scripted"
    };
    this.state = {
      ...this.state,
      turns: [greeting],
      phase: "questions",
      questionIndex: 0,
      mode: mode.mode ?? "scripted"
    };
    return greeting;
  }
  async respond(modeId, userText) {
    const mode = this.registry.get(modeId);
    const userTurn = {
      role: "user",
      content: userText,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      kind: "user"
    };
    this.state = {
      ...this.state,
      turns: [...this.state.turns, userTurn]
    };
    if ((mode.mode ?? "scripted") === "agentic") {
      return this.respondAgentic(userText);
    }
    const nextIndex = this.state.questionIndex + 1;
    if (nextIndex < mode.questions.length) {
      const nextQuestion = mode.questions[nextIndex];
      const assistantTurn = {
        role: "assistant",
        content: nextQuestion.text,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        kind: "scripted"
      };
      this.state = {
        ...this.state,
        turns: [...this.state.turns, assistantTurn],
        questionIndex: nextIndex
      };
      return assistantTurn;
    }
    const previewTurn = {
      role: "assistant",
      content: "__preview__",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.state = {
      ...this.state,
      turns: [...this.state.turns, previewTurn],
      phase: "preview"
    };
    return previewTurn;
  }
  async respondAgentic(userText) {
    if (!this.client) throw new Error("ConversationEngine: client not set");
    if (!this.context) throw new Error("ConversationEngine: context not set");
    if (!this.metadata) throw new Error("ConversationEngine: metadata not set");
    const res = await this.client.nextTurn({
      submissionId: this.state.submissionId,
      userText,
      selectedModelId: this.state.selectedModelId,
      repo: this.context.repo,
      panelRepo: this.context.panelRepo,
      metadata: this.metadata,
      transcript: this.state.turns,
      screenshotUrl: this.state.screenshotUrl,
      attachmentUrls: this.state.attachmentUrls,
      navigationBreadcrumb: this.context.navigationBreadcrumb,
      componentHint: this.context.componentHint,
      githubLogin: this.context.githubLogin
    });
    if (res.submissionId) {
      this.state = { ...this.state, submissionId: res.submissionId };
    }
    this.state = { ...this.state, knownFacts: res.knownFacts };
    return this.applyToolCall(res.toolCall);
  }
  applyToolCall(toolCall) {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    switch (toolCall.type) {
      case "ask_follow_up": {
        const turn = {
          role: "assistant",
          content: toolCall.question,
          timestamp: ts,
          kind: "agent"
        };
        this.state = {
          ...this.state,
          turns: [...this.state.turns, turn],
          clarifyOptions: void 0
        };
        return turn;
      }
      case "clarify_intent": {
        const turn = {
          role: "assistant",
          content: toolCall.question,
          timestamp: ts,
          kind: "clarify"
        };
        this.state = {
          ...this.state,
          turns: [...this.state.turns, turn],
          clarifyOptions: toolCall.options
        };
        return turn;
      }
      case "refuse_off_topic": {
        const turn = {
          role: "assistant",
          content: toolCall.redirect,
          timestamp: ts,
          kind: "redirect"
        };
        this.state = {
          ...this.state,
          turns: [...this.state.turns, turn],
          clarifyOptions: void 0
        };
        return turn;
      }
      case "draft_issue":
      case "revise_draft": {
        const turn = {
          role: "assistant",
          content: "__draft__",
          timestamp: ts,
          kind: "draft"
        };
        this.state = {
          ...this.state,
          turns: [...this.state.turns, turn],
          phase: "drafting",
          draft: toolCall.draft,
          clarifyOptions: void 0
        };
        return turn;
      }
    }
  }
  updateDraft(draft) {
    this.state = { ...this.state, draft };
  }
  async patchDraft(draft) {
    if (!this.client) throw new Error("ConversationEngine: client not set");
    if (!this.state.submissionId) throw new Error("ConversationEngine: no submissionId to patch");
    await this.client.patchDraft(this.state.submissionId, draft);
    this.updateDraft(draft);
  }
  getKnownFacts() {
    return this.state.knownFacts;
  }
  getPreview() {
    if (this.state.phase !== "preview") return null;
    const userAnswers = this.state.turns.filter((t) => t.role === "user").map((t) => t.content).join(" ");
    return {
      plainSummary: userAnswers.slice(0, 200),
      technicalDetails: this.metadata ? `**URL:** ${this.metadata.url}
**Browser:** ${this.metadata.userAgent}
**Viewport:** ${this.metadata.viewport.width}\xD7${this.metadata.viewport.height}` : "",
      screenshotUrl: this.state.screenshotUrl,
      attachmentUrls: this.state.attachmentUrls
    };
  }
  markSubmitted(issueUrl, issueNumber) {
    this.state = {
      ...this.state,
      phase: "submitted",
      issueUrl: issueUrl ?? this.state.issueUrl,
      issueNumber: issueNumber ?? this.state.issueNumber
    };
  }
  async startCommentSession(issueNumber, issueUrl, issueBody) {
    this.state = {
      ...this.state,
      phase: "commenting",
      issueNumber,
      issueUrl,
      turns: [
        {
          role: "assistant",
          content: `Let's draft a follow-up comment for issue #${issueNumber}. What would you like to add or change?`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          kind: "agent"
        }
      ],
      knownFacts: {},
      draft: void 0,
      clarifyOptions: void 0
    };
    this.commentIssueBody = issueBody;
    this.commentDraftBody = void 0;
  }
  getCommentDraftBody() {
    return this.commentDraftBody;
  }
  async respondToComment(userText) {
    if (!this.client) throw new Error("ConversationEngine: client not set");
    if (!this.context) throw new Error("ConversationEngine: context not set");
    const submissionId = this.state.submissionId;
    const issueNumber = this.state.issueNumber;
    const issueUrl = this.state.issueUrl;
    if (!submissionId) throw new Error("ConversationEngine: submissionId required");
    if (!issueNumber || !issueUrl) {
      throw new Error("ConversationEngine: comment session not started");
    }
    const userTurn = {
      role: "user",
      content: userText,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      kind: "user"
    };
    this.state = { ...this.state, turns: [...this.state.turns, userTurn] };
    const res = await this.client.nextCommentTurn({
      submissionId,
      issueNumber,
      issueUrl,
      issueBody: this.commentIssueBody ?? "",
      userText,
      transcript: this.state.turns,
      knownFacts: this.state.knownFacts,
      selectedModelId: this.state.selectedModelId,
      repo: this.context.repo,
      panelRepo: this.context.panelRepo
    });
    this.state = { ...this.state, knownFacts: res.knownFacts };
    if (res.toolCall.type === "draft_issue" || res.toolCall.type === "revise_draft") {
      this.commentDraftBody = res.toolCall.draft.body;
    }
    return this.applyToolCall(res.toolCall);
  }
  async approveComment(body) {
    if (!this.client) throw new Error("ConversationEngine: client not set");
    if (!this.state.submissionId) throw new Error("ConversationEngine: submissionId required");
    const result = await this.client.postComment(this.state.submissionId, body);
    return result;
  }
  reset() {
    this.state = {
      turns: [],
      phase: "greeting",
      questionIndex: 0
    };
    this.commentIssueBody = void 0;
    this.commentDraftBody = void 0;
  }
  // ── Saved sessions ─────────────────────────────────────────────────────────
  /**
   * Snapshot the current conversation into the saved-sessions list, then
   * reset to a fresh session. Returns the new (current) session id.
   */
  newSession() {
    this.snapshotCurrentIfMeaningful();
    this.currentSessionId = makeSessionId();
    this.reset();
    return this.currentSessionId;
  }
  /**
   * Snapshot the current conversation, then load a previously saved one.
   * The previously-saved session is removed from the saved list and becomes
   * current. Returns the loaded session id.
   */
  switchToSession(id) {
    const target = this.savedSessions.find((s) => s.id === id);
    if (!target) throw new Error(`ConversationEngine: no saved session ${id}`);
    this.snapshotCurrentIfMeaningful();
    this.savedSessions = this.savedSessions.filter((s) => s.id !== id);
    this.currentSessionId = target.id;
    this.currentModeId = target.modeId;
    this.state = { ...target.state };
    return target.id;
  }
  listSavedSessions() {
    return [...this.savedSessions];
  }
  getCurrentSessionId() {
    return this.currentSessionId;
  }
  /**
   * Drop the saved-sessions list and reset the current session id.
   * Called when the panel is closed entirely (saved sessions are scoped to
   * a single panel-open lifecycle, mirroring the portal behavior).
   */
  clearSavedSessions() {
    this.savedSessions = [];
    this.currentSessionId = makeSessionId();
  }
  snapshotCurrentIfMeaningful() {
    const hasUserTurn = this.state.turns.some((t) => t.role === "user");
    if (!hasUserTurn) return;
    if (!this.currentModeId) return;
    const firstUser = this.state.turns.find((t) => t.role === "user");
    const label = (firstUser?.content ?? "").slice(0, 40) || "Conversation";
    this.savedSessions = [
      ...this.savedSessions,
      {
        id: this.currentSessionId,
        modeId: this.currentModeId,
        savedAt: (/* @__PURE__ */ new Date()).toISOString(),
        state: { ...this.state },
        label
      }
    ];
  }
};
function makeSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ../core/src/navigation.ts
var MAX_ENTRIES = 20;
var NavigationTracker = class {
  constructor(enabled) {
    __publicField(this, "entries", []);
    __publicField(this, "enabled");
    __publicField(this, "originalPushState", null);
    __publicField(this, "originalReplaceState", null);
    __publicField(this, "popstateHandler", null);
    this.enabled = enabled && typeof window !== "undefined";
    if (!this.enabled) return;
    this.record();
    this.originalPushState = history.pushState.bind(history);
    this.originalReplaceState = history.replaceState.bind(history);
    history.pushState = (...args) => {
      this.originalPushState(...args);
      this.record();
    };
    history.replaceState = (...args) => {
      this.originalReplaceState(...args);
      this.record();
    };
    this.popstateHandler = () => this.record();
    window.addEventListener("popstate", this.popstateHandler);
  }
  record() {
    const entry = {
      url: window.location.href,
      title: document.title,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }
  }
  getBreadcrumb() {
    return [...this.entries];
  }
  destroy() {
    if (!this.enabled) return;
    if (this.originalPushState) history.pushState = this.originalPushState;
    if (this.originalReplaceState) history.replaceState = this.originalReplaceState;
    if (this.popstateHandler) window.removeEventListener("popstate", this.popstateHandler);
    this.entries = [];
  }
};

// ../core/src/modes.ts
var BUILT_IN_MODES = [
  {
    id: "feedback",
    label: "Feedback",
    description: "Report an issue or share feedback",
    comingSoon: false,
    mode: "agentic",
    questions: [
      {
        id: "opener",
        text: "What's going on? A quick format tip: tell me (1) what you were doing, (2) what happened, and (3) what you expected. Screenshots and files are welcome."
      }
    ]
  },
  {
    id: "bug-report",
    label: "Bug Report",
    description: "Detailed technical bug report",
    comingSoon: true,
    questions: []
  },
  {
    id: "ai-chat",
    label: "AI Chat",
    description: "Chat with an AI assistant",
    comingSoon: true,
    questions: []
  },
  {
    id: "support",
    label: "Support",
    description: "Get help from the team",
    comingSoon: true,
    questions: []
  }
];
var ModeRegistry = class {
  constructor(modes = BUILT_IN_MODES) {
    __publicField(this, "modes", /* @__PURE__ */ new Map());
    for (const mode of modes) {
      this.modes.set(mode.id, mode);
    }
  }
  register(mode) {
    this.modes.set(mode.id, mode);
  }
  get(id) {
    const mode = this.modes.get(id);
    if (!mode) throw new Error(`Mode not found: ${id}`);
    return mode;
  }
  getAll() {
    return Array.from(this.modes.values());
  }
  getActive() {
    return this.getAll().filter((m) => !m.comingSoon);
  }
};

// ../core/src/client.ts
var PanelApiClient = class {
  constructor({
    apiUrl,
    apiKey,
    githubLogin,
    githubLoginGetter
  }) {
    __publicField(this, "apiUrl");
    __publicField(this, "apiKey");
    __publicField(this, "githubLoginGetter");
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.githubLoginGetter = githubLoginGetter ?? (() => githubLogin);
  }
  headers() {
    const h = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`
    };
    const login = this.githubLoginGetter();
    if (login) h["x-github-login"] = login;
    return h;
  }
  async getCapabilities() {
    const res = await fetch(`${this.apiUrl}/v1/panel/capabilities`, {
      headers: this.headers()
    });
    if (!res.ok) throw new Error(`Capabilities fetch failed: ${res.status}`);
    return res.json();
  }
  async getRepoContext(params) {
    const res = await fetch(`${this.apiUrl}/v1/panel/repo-context`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(`Repo context fetch failed: ${res.status}`);
    return res.json();
  }
  /** Get a signed upload URL, upload directly to Supabase storage, return storage URL */
  async uploadAttachment(blob, filename) {
    const signRes = await fetch(`${this.apiUrl}/v1/panel/upload-url`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ filename, contentType: blob.type })
    });
    if (!signRes.ok) throw new Error(`Failed to get upload URL: ${signRes.status}`);
    const { uploadUrl, storageUrl } = await signRes.json();
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": blob.type }
    });
    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
    return storageUrl;
  }
  async nextTurn(req) {
    const res = await fetch(`${this.apiUrl}/v1/panel/next-turn`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`nextTurn failed (${res.status}): ${text}`);
    }
    return res.json();
  }
  async patchDraft(id, draft) {
    const res = await fetch(`${this.apiUrl}/v1/panel/draft/${id}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify({ draft })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`patchDraft failed (${res.status}): ${text}`);
    }
  }
  async nextCommentTurn(req) {
    const res = await fetch(`${this.apiUrl}/v1/panel/comment-next-turn`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`nextCommentTurn failed (${res.status}): ${text}`);
    }
    return res.json();
  }
  async postComment(submissionId, body) {
    const res = await fetch(`${this.apiUrl}/v1/panel/comment`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ submissionId, body })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`postComment failed (${res.status}): ${text}`);
    }
    return res.json();
  }
  async submit(payload) {
    const res = await fetch(`${this.apiUrl}/v1/panel/submit`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload)
    });
    if (res.status === 422) {
      const data = await res.json();
      const err = new Error(data.reason ?? data.error ?? "Draft not ready");
      err.status = 422;
      err.requiresConfirm = Boolean(data.requiresConfirm);
      err.reason = data.reason ?? data.error ?? "Draft not ready";
      throw err;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Submit failed (${res.status}): ${text}`);
    }
    return res.json();
  }
  async streamProcess(id, onEvent, options) {
    const res = await fetch(`${this.apiUrl}/v1/panel/process/${id}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ repo: options?.repo ?? "", panelRepo: options?.panelRepo })
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
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const event = JSON.parse(line.slice(6));
            onEvent(event);
          } catch {
          }
        }
      }
    }
    if (buffer.trim()) {
      for (const line of buffer.split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            const event = JSON.parse(line.slice(6));
            onEvent(event);
          } catch {
          }
        }
      }
    }
  }
};

// ../core/src/sdk.ts
var PanelSDK = class {
  constructor(config) {
    __publicField(this, "config");
    __publicField(this, "client");
    __publicField(this, "metadata");
    __publicField(this, "modes");
    __publicField(this, "voice");
    __publicField(this, "conversation");
    __publicField(this, "navigation");
    __publicField(this, "capabilities", null);
    __publicField(this, "resolvedGithubLogin");
    if (!config.apiUrl) throw new Error("PanelSDK: apiUrl is required");
    if (!config.apiKey) throw new Error("PanelSDK: apiKey is required");
    if (!config.repo) throw new Error("PanelSDK: repo is required");
    this.config = config;
    this.resolvedGithubLogin = config.githubLogin;
    this.client = new PanelApiClient({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      githubLoginGetter: () => this.resolvedGithubLogin
    });
    this.metadata = new MetadataCollector();
    this.modes = new ModeRegistry();
    this.voice = new VoiceInput();
    this.conversation = new ConversationEngine(this.modes);
    this.conversation.setClient(this.client);
    this.conversation.setContext({
      repo: config.repo,
      panelRepo: config.panelRepo,
      githubLogin: this.resolvedGithubLogin
    });
    if (config.defaultModelId) {
      this.conversation.setSelectedModelId(config.defaultModelId);
    }
    this.navigation = new NavigationTracker(config.navigationTracking === true);
  }
  async init() {
    if (this.config.resolveGithubLogin) {
      try {
        const login = await this.config.resolveGithubLogin();
        if (login) {
          this.resolvedGithubLogin = login;
          this.conversation.setContext({
            repo: this.config.repo,
            panelRepo: this.config.panelRepo,
            githubLogin: login
          });
        }
      } catch {
      }
    }
    this.capabilities = await this.client.getCapabilities();
    if (!this.config.defaultModelId && this.capabilities?.defaultModelId) {
      this.conversation.setSelectedModelId(this.capabilities.defaultModelId);
    }
  }
  getGithubLogin() {
    return this.resolvedGithubLogin;
  }
  setSelectedModelId(id) {
    this.conversation.setSelectedModelId(id);
  }
  getCapabilities() {
    return this.capabilities;
  }
  getAvailableModes() {
    return this.capabilities?.modes ?? [];
  }
  destroy() {
    this.metadata.destroy();
    this.voice.abort();
    this.navigation.destroy();
  }
};

// src/PanelProvider.tsx
import { jsx } from "react/jsx-runtime";
var PanelContext = createContext(null);
function usePanelContext() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanelContext must be used within PanelProvider");
  return ctx;
}
function PanelProvider({ config, children }) {
  const sdkRef = useRef(null);
  const sdk = useMemo(() => {
    if (sdkRef.current) sdkRef.current.destroy();
    const s = new PanelSDK(config);
    sdkRef.current = s;
    return s;
  }, [config.apiUrl, config.apiKey, config.repo, config.panelRepo, config.githubLogin]);
  const [capabilities, setCapabilities] = useState(null);
  const [activeModeId, setActiveModeId] = useState("feedback");
  const [isOpen, setIsOpenState] = useState(false);
  const [selectedModelId, setSelectedModelIdState] = useState(
    config.defaultModelId
  );
  const [savedSessions, setSavedSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(
    () => sdk.conversation.getCurrentSessionId()
  );
  const panelElementRef = useRef(null);
  const setIsOpen = (open) => {
    if (!open && isOpen) {
      sdk.conversation.clearSavedSessions();
      setSavedSessions([]);
      setCurrentSessionId(sdk.conversation.getCurrentSessionId());
    }
    setIsOpenState(open);
  };
  const newSession = () => {
    const newId = sdk.conversation.newSession();
    setSavedSessions(sdk.conversation.listSavedSessions());
    setCurrentSessionId(newId);
  };
  const switchSession = (id) => {
    const switched = sdk.conversation.switchToSession(id);
    setSavedSessions(sdk.conversation.listSavedSessions());
    setCurrentSessionId(switched);
  };
  const registerPanelElement = (el) => {
    panelElementRef.current = el;
  };
  useEffect(() => {
    let cancelled = false;
    sdk.init().then(() => {
      if (!cancelled) {
        const caps = sdk.getCapabilities();
        setCapabilities(caps);
        const modes = sdk.getAvailableModes();
        if (modes.length > 0) setActiveModeId(modes[0]);
        if (!config.defaultModelId && caps?.defaultModelId) {
          setSelectedModelIdState(caps.defaultModelId);
          sdk.setSelectedModelId(caps.defaultModelId);
        }
      }
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[Panel] SDK init failed: ${msg}. Check your apiUrl, apiKey, and PANEL_ALLOWED_ORIGINS backend config. The panel button will not render until init succeeds.`
      );
    });
    return () => {
      cancelled = true;
      sdk.destroy();
    };
  }, [sdk, config.defaultModelId]);
  const setSelectedModelId = (id) => {
    setSelectedModelIdState(id);
    sdk.setSelectedModelId(id);
  };
  const betaModelSelection = config.betaModelSelection ?? capabilities?.betaModelSelection ?? false;
  const availableModels = useMemo(() => {
    if (config.availableModels && config.availableModels.length > 0) return config.availableModels;
    return capabilities?.models ?? [];
  }, [config.availableModels, capabilities?.models]);
  const value = useMemo(
    () => ({
      sdk,
      capabilities,
      activeModeId,
      setActiveModeId,
      isOpen,
      setIsOpen,
      selectedModelId,
      setSelectedModelId,
      betaModelSelection,
      availableModels,
      savedSessions,
      currentSessionId,
      newSession,
      switchSession,
      panelElementRef,
      registerPanelElement
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sdk, capabilities, activeModeId, isOpen, selectedModelId, betaModelSelection, availableModels, savedSessions, currentSessionId]
  );
  return /* @__PURE__ */ jsx(PanelContext.Provider, { value, children });
}

export {
  captureScreenshot,
  blobToDataUrl,
  VoiceInput,
  usePanelContext,
  PanelProvider
};
//# sourceMappingURL=chunk-MJEBL2M5.mjs.map