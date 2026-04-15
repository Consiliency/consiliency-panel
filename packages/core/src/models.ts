import type { PanelModelOption } from "@consiliency/panel-types";

export const PANEL_MODELS: PanelModelOption[] = [
  { id: "gpt-5-nano", label: "GPT-5 Nano", provider: "OpenAI" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "Anthropic" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", provider: "Google / OpenRouter" },
  { id: "gemma-3-27b", label: "Gemma 3 27B", provider: "Google / OpenRouter" },
  { id: "kimi-vl", label: "Kimi-VL", provider: "Moonshot / OpenRouter" },
];

export const DEFAULT_MODEL_ID = "gpt-5-nano";
