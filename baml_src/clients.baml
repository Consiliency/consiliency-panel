generator lang_ts {
  output_type "typescript"
  output_dir "../"
  version "0.219.0"
}

// Classification: fast + cheap — GPT-4.1 nano ($0.05/$0.20 per 1M tokens)
client<llm> OpenAINano {
  provider openai
  options {
    model "gpt-4.1-nano"
    max_tokens 1024
    api_key env.OPENAI_API_KEY
  }
}

// Enrichment: long-context code reasoning — Gemini 2.5 Flash ($0.30/$2.50 per 1M tokens, 1M context)
client<llm> GeminiFlash {
  provider google-ai
  options {
    model "gemini-2.5-flash"
    max_tokens 4096
    api_key env.GOOGLE_API_KEY
  }
}

// Formatting: structured output + instruction following — GPT-4.1 Mini ($0.20/$0.80 per 1M tokens)
client<llm> OpenAIMini {
  provider openai
  options {
    model "gpt-4.1-mini"
    max_tokens 4096
    api_key env.OPENAI_API_KEY
  }
}
