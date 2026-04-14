import { validateApiKey, unauthorized } from "@/lib/auth";
import { corsPreflight, withCors } from "@/lib/cors";

export async function OPTIONS(req: Request) { return corsPreflight(req); }

export async function POST(req: Request): Promise<Response> {
  const key = await validateApiKey(req);
  if (!key) return withCors(unauthorized(), req);

  const form = await req.formData();
  const audio = form.get("audio") as Blob | null;
  if (!audio) return withCors(Response.json({ error: "No audio provided" }, { status: 400 }), req);

  const formData = new FormData();
  formData.append("file", audio, "recording.webm");
  formData.append("model_id", "scribe_v1");

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("ElevenLabs STT error:", err);
    return withCors(Response.json({ error: "Transcription failed" }, { status: 502 }), req);
  }

  const data = await res.json() as { text?: string };
  return withCors(Response.json({ transcript: data.text ?? "" }), req);
}
