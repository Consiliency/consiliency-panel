import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConversationEngine } from "../conversation";
import { ModeRegistry, BUILT_IN_MODES } from "../modes";
import type {
  ModeDefinition,
  NextTurnResponse,
  SubmissionMetadata,
  ToolCall,
} from "@consiliency/panel-types";

// A scripted clone of the feedback mode so legacy scripted behavior can still
// be exercised after feedback switched to agentic.
const SCRIPTED_FEEDBACK: ModeDefinition = {
  id: "feedback",
  label: "Feedback",
  description: "scripted test clone",
  mode: "scripted",
  questions: [
    { id: "q1", text: "What were you doing?" },
    { id: "q2", text: "What happened?" },
    { id: "q3", text: "How urgent?" },
  ],
};

function makeScriptedEngine() {
  const registry = new ModeRegistry();
  BUILT_IN_MODES.forEach((m) => registry.register(m));
  registry.register(SCRIPTED_FEEDBACK);
  return new ConversationEngine(registry);
}

function makeMetadata(): SubmissionMetadata {
  return {
    url: "https://app.test/page",
    title: "Test",
    userAgent: "jsdom",
    viewport: { width: 1280, height: 800 },
    timestamp: new Date().toISOString(),
    referrer: "",
  };
}

describe("ConversationEngine (scripted)", () => {
  let engine: ConversationEngine;

  beforeEach(() => {
    engine = makeScriptedEngine();
  });

  it("starts in greeting phase", () => {
    expect(engine.state.phase).toBe("greeting");
    expect(engine.state.turns).toHaveLength(0);
  });

  it("start() returns assistant greeting and transitions to questions", async () => {
    const turn = await engine.start("feedback");
    expect(turn.role).toBe("assistant");
    expect(turn.content).toBeTruthy();
    expect(engine.state.phase).toBe("questions");
    expect(engine.state.turns).toHaveLength(1);
  });

  it("3-turn guided flow reaches preview phase", async () => {
    await engine.start("feedback");
    for (let i = 0; i < SCRIPTED_FEEDBACK.questions.length; i++) {
      const response = await engine.respond("feedback", `Answer ${i + 1}`);
      if (i < SCRIPTED_FEEDBACK.questions.length - 1) {
        expect(response.role).toBe("assistant");
        expect(engine.state.phase).toBe("questions");
      } else {
        expect(engine.state.phase).toBe("preview");
      }
    }
  });

  it("getPreview() returns null before preview phase", async () => {
    await engine.start("feedback");
    expect(engine.getPreview()).toBeNull();
  });

  it("getPreview() returns non-null after all questions answered", async () => {
    await engine.start("feedback");
    for (let i = 0; i < SCRIPTED_FEEDBACK.questions.length; i++) {
      await engine.respond("feedback", `Answer ${i + 1}`);
    }
    const preview = engine.getPreview();
    expect(preview).not.toBeNull();
    expect(typeof preview!.plainSummary).toBe("string");
  });

  it("getPreview() plainSummary contains user answers", async () => {
    await engine.start("feedback");
    const answers = SCRIPTED_FEEDBACK.questions.map((_, i) => `unique-answer-${i}`);
    for (const answer of answers) {
      await engine.respond("feedback", answer);
    }
    const preview = engine.getPreview();
    expect(preview!.plainSummary.length).toBeGreaterThan(0);
  });

  it("reset() returns to initial state", async () => {
    await engine.start("feedback");
    await engine.respond("feedback", "Some answer");
    engine.reset();
    expect(engine.state.phase).toBe("greeting");
    expect(engine.state.turns).toHaveLength(0);
    expect(engine.getPreview()).toBeNull();
  });

  it("addAttachment() stores AttachmentRef objects", () => {
    engine.addAttachment({ url: "https://example.com/a.png", type: "screenshot", name: "a.png" });
    engine.addAttachment({ url: "https://example.com/b.pdf", type: "file", name: "b.pdf" });
    expect(engine.state.attachmentUrls).toHaveLength(2);
    expect(engine.state.attachmentUrls?.[0]).toEqual({
      url: "https://example.com/a.png",
      type: "screenshot",
      name: "a.png",
    });
    expect(engine.state.attachmentUrls?.[1].type).toBe("file");
  });

  it("getPreview() surfaces screenshotUrl and attachmentUrls", async () => {
    await engine.start("feedback");
    for (let i = 0; i < SCRIPTED_FEEDBACK.questions.length; i++) {
      await engine.respond("feedback", `Answer ${i + 1}`);
    }
    engine.setScreenshotUrl("https://example.com/s.png");
    engine.addAttachment({ url: "https://example.com/f.pdf", type: "file", name: "f.pdf" });
    const preview = engine.getPreview();
    expect(preview!.screenshotUrl).toBe("https://example.com/s.png");
    expect(preview!.attachmentUrls).toHaveLength(1);
    expect(preview!.attachmentUrls?.[0].name).toBe("f.pdf");
  });

  it("markSubmitted() sets phase to submitted", async () => {
    await engine.start("feedback");
    for (let i = 0; i < SCRIPTED_FEEDBACK.questions.length; i++) {
      await engine.respond("feedback", `Answer ${i + 1}`);
    }
    engine.markSubmitted();
    expect(engine.state.phase).toBe("submitted");
  });
});

describe("ConversationEngine (agentic)", () => {
  function makeAgenticEngine(nextTurn: (req: unknown) => Promise<NextTurnResponse>) {
    const registry = new ModeRegistry();
    BUILT_IN_MODES.forEach((m) => registry.register(m));
    const engine = new ConversationEngine(registry);
    const fakeClient = {
      nextTurn: vi.fn(nextTurn),
      patchDraft: vi.fn(),
      nextCommentTurn: vi.fn(),
      postComment: vi.fn(),
    };
    engine.setClient(fakeClient as unknown as Parameters<typeof engine.setClient>[0]);
    engine.setMetadata(makeMetadata());
    engine.setContext({ repo: "owner/repo" });
    return { engine, fakeClient };
  }

  function response(toolCall: ToolCall, submissionId: string | null = "sub-1"): NextTurnResponse {
    return { submissionId, toolCall, knownFacts: {} };
  }

  it("ask_follow_up appends an agent turn with kind=agent", async () => {
    const { engine } = makeAgenticEngine(async () =>
      response({ type: "ask_follow_up", question: "When did it start?", reason: "need timing" }),
    );
    await engine.start("feedback");
    const turn = await engine.respond("feedback", "the button doesn't work");
    expect(turn.kind).toBe("agent");
    expect(turn.content).toBe("When did it start?");
    expect(engine.state.phase).toBe("questions");
  });

  it("refuse_off_topic appends a redirect turn and does not advance phase", async () => {
    const { engine } = makeAgenticEngine(async () =>
      response({ type: "refuse_off_topic", redirect: "Let's talk about this app." }, null),
    );
    await engine.start("feedback");
    const turn = await engine.respond("feedback", "what's the weather?");
    expect(turn.kind).toBe("redirect");
    expect(turn.content).toBe("Let's talk about this app.");
    expect(engine.state.phase).toBe("questions");
    expect(engine.state.submissionId).toBeUndefined();
  });

  it("clarify_intent stores options and uses kind=clarify", async () => {
    const { engine } = makeAgenticEngine(async () =>
      response({
        type: "clarify_intent",
        question: "Is this a bug or a feature request?",
        options: ["bug", "feature"],
      }),
    );
    await engine.start("feedback");
    const turn = await engine.respond("feedback", "something's off");
    expect(turn.kind).toBe("clarify");
    expect(engine.state.clarifyOptions).toEqual(["bug", "feature"]);
  });

  it("draft_issue flips phase to drafting and stores the draft", async () => {
    const draft = {
      title: "Submit button unresponsive",
      body: "Clicking submit on the settings form does nothing.",
      severity: "medium" as const,
      kind: "bug" as const,
    };
    const { engine } = makeAgenticEngine(async () => response({ type: "draft_issue", draft }));
    await engine.start("feedback");
    const turn = await engine.respond("feedback", "click submit and nothing happens");
    expect(turn.kind).toBe("draft");
    expect(engine.state.phase).toBe("drafting");
    expect(engine.state.draft).toEqual(draft);
  });

  it("captures submissionId from the response", async () => {
    const { engine } = makeAgenticEngine(async () =>
      response({ type: "ask_follow_up", question: "When?", reason: "" }, "new-sub-id"),
    );
    await engine.start("feedback");
    await engine.respond("feedback", "first turn");
    expect(engine.state.submissionId).toBe("new-sub-id");
  });
});

describe("ConversationEngine (saved sessions)", () => {
  let engine: ConversationEngine;

  beforeEach(() => {
    engine = makeScriptedEngine();
  });

  it("newSession() snapshots current and resets, after at least one user turn", async () => {
    await engine.start("feedback");
    await engine.respond("feedback", "first session message");
    const firstId = engine.getCurrentSessionId();

    engine.newSession();

    const saved = engine.listSavedSessions();
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(firstId);
    expect(saved[0].state.turns.some((t) => t.content === "first session message")).toBe(true);
    expect(engine.getCurrentSessionId()).not.toBe(firstId);
    expect(engine.state.phase).toBe("greeting");
    expect(engine.state.turns).toHaveLength(0);
  });

  it("newSession() does not snapshot when user has not engaged", async () => {
    await engine.start("feedback");
    engine.newSession();
    expect(engine.listSavedSessions()).toHaveLength(0);
  });

  it("switchToSession() restores prior turns and removes from saved list", async () => {
    await engine.start("feedback");
    await engine.respond("feedback", "session A turn");
    const aId = engine.getCurrentSessionId();
    engine.newSession();
    await engine.start("feedback");
    await engine.respond("feedback", "session B turn");

    engine.switchToSession(aId);

    expect(engine.state.turns.some((t) => t.content === "session A turn")).toBe(true);
    expect(engine.state.turns.some((t) => t.content === "session B turn")).toBe(false);
    expect(engine.getCurrentSessionId()).toBe(aId);
    // B should now be in the saved list, A should not
    const saved = engine.listSavedSessions();
    expect(saved.find((s) => s.id === aId)).toBeUndefined();
    expect(saved.some((s) => s.state.turns.some((t) => t.content === "session B turn"))).toBe(true);
  });

  it("clearSavedSessions() empties the list", async () => {
    await engine.start("feedback");
    await engine.respond("feedback", "x");
    engine.newSession();
    expect(engine.listSavedSessions()).toHaveLength(1);
    engine.clearSavedSessions();
    expect(engine.listSavedSessions()).toHaveLength(0);
  });
});
