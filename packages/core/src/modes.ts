import type { ModeDefinition, ModeId } from "@consiliency/panel-types";

export const BUILT_IN_MODES: ModeDefinition[] = [
  {
    id: "feedback",
    label: "Feedback",
    description: "Report an issue or share feedback",
    comingSoon: false,
    mode: "agentic",
    questions: [
      {
        id: "opener",
        text: "What's going on? A quick format tip: tell me (1) what you were doing, (2) what happened, and (3) what you expected. Screenshots and files are welcome.",
      },
    ],
  },
  {
    id: "bug-report",
    label: "Bug Report",
    description: "Detailed technical bug report",
    comingSoon: true,
    questions: [],
  },
  {
    id: "ai-chat",
    label: "AI Chat",
    description: "Chat with an AI assistant",
    comingSoon: true,
    questions: [],
  },
  {
    id: "support",
    label: "Support",
    description: "Get help from the team",
    comingSoon: true,
    questions: [],
  },
];

export class ModeRegistry {
  private modes = new Map<ModeId, ModeDefinition>();

  constructor(modes: ModeDefinition[] = BUILT_IN_MODES) {
    for (const mode of modes) {
      this.modes.set(mode.id, mode);
    }
  }

  register(mode: ModeDefinition): void {
    this.modes.set(mode.id, mode);
  }

  get(id: ModeId): ModeDefinition {
    const mode = this.modes.get(id);
    if (!mode) throw new Error(`Mode not found: ${id}`);
    return mode;
  }

  getAll(): ModeDefinition[] {
    return Array.from(this.modes.values());
  }

  getActive(): ModeDefinition[] {
    return this.getAll().filter((m) => !m.comingSoon);
  }
}
