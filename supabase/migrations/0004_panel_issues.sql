CREATE TABLE panel_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES panel_submissions(id) ON DELETE CASCADE,
  github_issue_number int,
  github_issue_url text,
  plain_summary text NOT NULL,
  technical_details jsonb NOT NULL DEFAULT '{}',
  labels text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE panel_issues ENABLE ROW LEVEL SECURITY;

-- Linked via submission; service role writes, no direct client writes
