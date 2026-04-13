generator lang_ts {
  output_type "typescript"
  output_dir "../"
  version "0.220.0"
}

// Classification: fast + cheap structured output — GPT-4.1 Nano ($0.05/$0.20 per 1M)
client<llm> OpenAINano {
  provider openai
  options {
    model "gpt-4.1-nano"
    max_tokens 1024
    api_key env.OPENAI_API_KEY
  }
}

// Enrichment: repo context + code understanding — Gemini 4 31B via OpenRouter ($0.13/$0.38 per 1M)
// Released April 2, 2026 — top 90% coding index on OpenRouter, native vision, 262K context
client<llm> Gemma4 {
  provider openai
  options {
    model "google/gemma-4-31b-it"
    base_url "https://openrouter.ai/api/v1"
    api_key env.OPENROUTER_API_KEY
    max_tokens 4096
  }
}

// Formatting: structured GitHub issue output — Kimi K2.5 via OpenRouter ($0.38/$1.72 per 1M)
// 1T total / 32B active MoE, 0.54% structured output error rate — best among open models
client<llm> KimiK2 {
  provider openai
  options {
    model "moonshotai/kimi-k2.5"
    base_url "https://openrouter.ai/api/v1"
    api_key env.OPENROUTER_API_KEY
    max_tokens 4096
  }
}
