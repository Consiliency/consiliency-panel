-- Remove duplicate panel_issues rows (keep lowest github_issue_number per submission)
DELETE FROM panel_issues
WHERE id NOT IN (
  SELECT DISTINCT ON (submission_id) id
  FROM panel_issues
  ORDER BY submission_id, github_issue_number ASC NULLS LAST, created_at ASC
);

-- Prevent future duplicates
ALTER TABLE panel_issues
  ADD CONSTRAINT panel_issues_submission_id_unique UNIQUE (submission_id);
