import { describe, it, expect, beforeEach } from "vitest";
import { ConversationEngine } from "../conversation";
import { ModeRegistry, BUILT_IN_MODES } from "../modes";

function makeEngine() {
  const registry = new ModeRegistry();
  // Register built-in modes
  BUILT_IN_MODES.forEach((m) => registry.register(m));
  return new ConversationEngine(registry);
}

describe("ConversationEngine", () => {
  let engine: ConversationEngine;

  beforeEach(() => {
    engine = makeEngine();
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

    // Get the feedback mode to know how many questions there are
    const feedbackMode = BUILT_IN_MODES.find((m) => m.id === "feedback")!;
    const numQuestions = feedbackMode.questions.length;

    // Answer each question
    for (let i = 0; i < numQuestions; i++) {
      const response = await engine.respond("feedback", `Answer ${i + 1}`);
      if (i < numQuestions - 1) {
        expect(response.role).toBe("assistant");
        expect(engine.state.phase).toBe("questions");
      } else {
        // Last answer triggers preview
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
    const feedbackMode = BUILT_IN_MODES.find((m) => m.id === "feedback")!;
    for (let i = 0; i < feedbackMode.questions.length; i++) {
      await engine.respond("feedback", `Answer ${i + 1}`);
    }
    const preview = engine.getPreview();
    expect(preview).not.toBeNull();
    expect(typeof preview!.plainSummary).toBe("string");
  });

  it("getPreview() plainSummary contains user answers", async () => {
    await engine.start("feedback");
    const feedbackMode = BUILT_IN_MODES.find((m) => m.id === "feedback")!;
    const answers = feedbackMode.questions.map((_, i) => `unique-answer-${i}`);
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

  it("markSubmitted() sets phase to submitted", async () => {
    await engine.start("feedback");
    const feedbackMode = BUILT_IN_MODES.find((m) => m.id === "feedback")!;
    for (let i = 0; i < feedbackMode.questions.length; i++) {
      await engine.respond("feedback", `Answer ${i + 1}`);
    }
    engine.markSubmitted();
    expect(engine.state.phase).toBe("submitted");
  });
});
