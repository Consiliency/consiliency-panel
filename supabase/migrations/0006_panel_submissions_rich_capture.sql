ALTER TABLE panel_submissions
  ADD COLUMN navigation_breadcrumb jsonb,
  ADD COLUMN component_hint text,
  ADD COLUMN attachment_urls jsonb;
