import { unauthorized, validateApiKey } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(req: Request): Promise<Response> {
  const key = await validateApiKey(req);
  if (!key) return unauthorized();

  const body = (await req.json()) as { filename: string; contentType: string };
  const path = `${key.productKey}/${Date.now()}-${body.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.storage
    .from("panel-attachments")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return Response.json({ error: "Failed to create upload URL" }, { status: 500 });
  }

  const storageUrl = supabase.storage.from("panel-attachments").getPublicUrl(path).data.publicUrl;

  return Response.json({
    uploadUrl: data.signedUrl,
    storageUrl,
    path,
  });
}
