-- Agentic intake: known-facts tracker, issue kind, selected model, comment drafts

ALTER TABLE panel_submissions
  ADD COLUMN known_facts jsonb,
  ADD COLUMN kind text,
  ADD COLUMN selected_model_id text;

ALTER TABLE panel_submissions DROP CONSTRAINT IF EXISTS panel_submissions_status_check;
ALTER TABLE panel_submissions ADD CONSTRAINT panel_submissions_status_check
  CHECK (status IN ('pending','processing','completed','failed','drafting'));

CREATE TABLE panel_comment_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES panel_submissions(id) ON DELETE CASCADE,
  product_key text NOT NULL,
  github_login text,
  github_issue_number integer NOT NULL,
  github_issue_url text NOT NULL,
  issue_body text,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  known_facts jsonb,
  draft_body text,
  status text NOT NULL DEFAULT 'drafting'
    CHECK (status IN ('drafting','approved','posted','abandoned')),
  selected_model_id text,
  comment_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX panel_comment_drafts_submission_idx ON panel_comment_drafts(submission_id);
CREATE INDEX panel_comment_drafts_issue_idx ON panel_comment_drafts(github_issue_number);

ALTER TABLE panel_comment_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own comment drafts read" ON panel_comment_drafts
  FOR SELECT USING (github_login = (auth.jwt() ->> 'login'));
