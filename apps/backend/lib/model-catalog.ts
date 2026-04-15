import type { PanelModelOption } from "@consiliency/panel-types";

export const PANEL_MODELS: PanelModelOption[] = [
  { id: "gpt-5-nano", label: "GPT-5 Nano", provider: "OpenAI" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "Anthropic" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", provider: "Google / OpenRouter" },
  { id: "gemma-3-27b", label: "Gemma 3 27B", provider: "Google / OpenRouter" },
  { id: "kimi-vl", label: "Kimi-VL", provider: "Moonshot / OpenRouter" },
];

export const DEFAULT_MODEL_ID = "gpt-5-nano";

const MODEL_TO_BAML_CLIENT: Record<string, string> = {
  "gpt-5-nano": "OpenAINano",
  "claude-haiku-4-5": "ClaudeHaiku",
  "gemini-3.1-flash-lite": "GeminiFlashLite",
  "gemma-3-27b": "Gemma3",
  "kimi-vl": "KimiVL",
};

export function resolveBamlClient(modelId: string | undefined | null): string {
  if (!modelId) return MODEL_TO_BAML_CLIENT[DEFAULT_MODEL_ID];
  return MODEL_TO_BAML_CLIENT[modelId] ?? MODEL_TO_BAML_CLIENT[DEFAULT_MODEL_ID];
}

export function isBetaModelSelectionEnabled(): boolean {
  const raw = process.env.PANEL_BETA_MODEL_SELECTION;
  if (raw === undefined) return true;
  return raw.toLowerCase() !== "false" && raw !== "0";
}
