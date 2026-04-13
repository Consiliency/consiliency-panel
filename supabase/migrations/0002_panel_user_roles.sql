CREATE TABLE panel_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_login text NOT NULL,
  role text NOT NULL DEFAULT 'guest' CHECK (role IN ('guest','contractor','team','admin')),
  product_key text NOT NULL,
  granted_by text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (github_login, product_key)
);

ALTER TABLE panel_user_roles ENABLE ROW LEVEL SECURITY;

-- Only service role can manage roles; no direct client access
