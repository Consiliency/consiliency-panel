generator lang_ts {
  output_type "typescript"
  output_dir "../"
  version "0.220.0"
}

// Classification + routing + cheap structured output (non-reasoning models)
// Default: gpt-4.1-nano
// Override via: BAML_MODEL_CLASSIFY=<model-id>
client<llm> OpenAINano {
  provider openai
  options {
    model env.BAML_MODEL_CLASSIFY
    max_tokens 1024
    api_key env.OPENAI_API_KEY
  }
}

// Reasoning-model variant (gpt-5-nano, o3-mini, etc.)
// Reasoning models reject max_tokens; use max_completion_tokens instead.
// Override via: BAML_MODEL_AGENT_NANO_REASONING=<model-id>
client<llm> OpenAINanoReasoning {
  provider openai
  options {
    model env.BAML_MODEL_AGENT_NANO_REASONING
    max_tokens null
    max_completion_tokens 1024
    api_key env.OPENAI_API_KEY
  }
}

// Enrichment: repo context + code understanding via OpenRouter
// Default: google/gemma-3-27b-it
// Override via: BAML_MODEL_ENRICH=<openrouter-model-id>
client<llm> Gemma3 {
  provider openai
  options {
    model env.BAML_MODEL_ENRICH
    base_url "https://openrouter.ai/api/v1"
    api_key env.OPENROUTER_API_KEY
    max_tokens 4096
  }
}

// Fix suggestion: code analysis and root cause (Anthropic direct)
// Default: claude-sonnet-4-6
// Override via: BAML_MODEL_FIX=<anthropic-model-id>
client<llm> ClaudeSonnet {
  provider anthropic
  options {
    model env.BAML_MODEL_FIX
    max_tokens 2048
    api_key env.ANTHROPIC_API_KEY
  }
}

// Formatting: structured GitHub issue output via OpenRouter
// Default: moonshotai/kimi-k2.5 ($0.38/$1.72 per 1M)
// Override via: BAML_MODEL_FORMAT=<openrouter-model-id>
client<llm> KimiK2 {
  provider openai
  options {
    model env.BAML_MODEL_FORMAT
    base_url "https://openrouter.ai/api/v1"
    api_key env.OPENROUTER_API_KEY
    max_tokens 4096
  }
}

// --- Conversation agents (user-selectable in beta model picker) ---

// Claude Haiku 4.5 — Anthropic direct
// Override via: BAML_MODEL_AGENT_HAIKU=<anthropic-model-id>
client<llm> ClaudeHaiku {
  provider anthropic
  options {
    model env.BAML_MODEL_AGENT_HAIKU
    max_tokens 2048
    api_key env.ANTHROPIC_API_KEY
  }
}

// Gemini 3.1 Flash-Lite — OpenRouter
// Override via: BAML_MODEL_AGENT_GEMINI=<openrouter-model-id>
client<llm> GeminiFlashLite {
  provider openai
  options {
    model env.BAML_MODEL_AGENT_GEMINI
    base_url "https://openrouter.ai/api/v1"
    api_key env.OPENROUTER_API_KEY
    max_tokens 2048
  }
}

// Kimi-VL — OpenRouter (multimodal; distinct from text-only KimiK2)
// Override via: BAML_MODEL_AGENT_KIMI_VL=<openrouter-model-id>
client<llm> KimiVL {
  provider openai
  options {
    model env.BAML_MODEL_AGENT_KIMI_VL
    base_url "https://openrouter.ai/api/v1"
    api_key env.OPENROUTER_API_KEY
    max_tokens 2048
  }
}

// Topic relevance pre-check — fixed cheap Nano, not user-selectable
// Override via: BAML_MODEL_TOPIC_CHECK=<model-id>
client<llm> TopicCheck {
  provider openai
  options {
    model env.BAML_MODEL_TOPIC_CHECK
    max_tokens 256
    api_key env.OPENAI_API_KEY
  }
}
