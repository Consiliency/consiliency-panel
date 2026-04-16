import { unauthorized, validateApiKey } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { corsPreflight, withCors } from "@/lib/cors";
import { isRateLimited, tooManyRequests } from "@/lib/ratelimit";

export async function OPTIONS(req: Request) { return corsPreflight(req); }

export async function POST(req: Request): Promise<Response> {
  const key = await validateApiKey(req);
  if (!key) return withCors(unauthorized(), req);

  if (await isRateLimited(key.productKey)) return withCors(tooManyRequests(), req);

  const body = (await req.json()) as { filename: string; contentType: string };
  const path = `${key.productKey}/${Date.now()}-${body.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.storage
    .from("panel-attachments")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return withCors(Response.json({ error: "Failed to create upload URL" }, { status: 500 }), req);
  }

  const storageUrl = supabase.storage.from("panel-attachments").getPublicUrl(path).data.publicUrl;

  return withCors(Response.json({
    uploadUrl: data.signedUrl,
    storageUrl,
    path,
  }), req);
}
