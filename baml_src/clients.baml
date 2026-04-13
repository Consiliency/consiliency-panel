client<llm> ClaudeSonnet {
  provider anthropic
  options {
    model "claude-sonnet-4-6"
    max_tokens 4096
  }
}

client<llm> ClaudeHaiku {
  provider anthropic
  options {
    model "claude-haiku-4-5-20251001"
    max_tokens 1024
  }
}
