-- Storage bucket for screenshots and file attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'panel-attachments',
  'panel-attachments',
  false,
  10485760,  -- 10 MB
  ARRAY['image/png','image/jpeg','image/webp','image/gif','application/pdf','text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Service role handles all storage operations via signed URLs
-- No direct client RLS needed; signed URLs enforce access
