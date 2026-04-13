// Provide dummy env vars so modules that read process.env at call time don't throw
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test-service-key";
process.env.PANEL_INTERNAL_SECRET = "test-internal-secret";
process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
process.env.GITHUB_TOKEN_GUEST = "test-github-guest";
process.env.GITHUB_TOKEN_CONTRACTOR = "test-github-contractor";
process.env.GITHUB_TOKEN_TEAM = "test-github-team";
process.env.NEXT_PUBLIC_PANEL_API_URL = "https://panel-api.consiliency.io";
process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-upstash-token";
