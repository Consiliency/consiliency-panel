generator lang_ts {
  output_type "typescript"
  output_dir "../"
  version "0.220.0"
}

// Classification: fast + cheap structured output
// Default: gpt-4.1-nano ($0.05/$0.20 per 1M)
// Override via: BAML_MODEL_CLASSIFY=<model-id>
client<llm> OpenAINano {
  provider openai
  options {
    model env.BAML_MODEL_CLASSIFY
    max_tokens 1024
    api_key env.OPENAI_API_KEY
  }
}

// Enrichment: repo context + code understanding via OpenRouter
// Default: google/gemma-4-31b-it ($0.13/$0.38 per 1M)
// Override via: BAML_MODEL_ENRICH=<openrouter-model-id>
client<llm> Gemma4 {
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
