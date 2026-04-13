CREATE TABLE panel_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  product_key text NOT NULL,
  max_tier text NOT NULL DEFAULT 'guest' CHECK (max_tier IN ('guest','contractor','team')),
  owner_github_login text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE panel_api_keys ENABLE ROW LEVEL SECURITY;
-- service role only; no anon/authenticated client access
