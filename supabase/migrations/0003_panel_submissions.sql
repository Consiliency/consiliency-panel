CREATE TABLE panel_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key text NOT NULL,
  github_login text,
  tier text NOT NULL,
  transcript jsonb NOT NULL,
  metadata jsonb NOT NULL,
  console_errors jsonb,
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE panel_submissions ENABLE ROW LEVEL SECURITY;

-- Submitters can read their own submissions
CREATE POLICY "own submissions read" ON panel_submissions
  FOR SELECT USING (github_login = (auth.jwt() ->> 'login'));
