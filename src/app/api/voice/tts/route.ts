/**
 * Voice TTS — Vapi "custom-voice" endpoint.
 *
 * During a live call, Vapi POSTs { message: { type:"voice-request", text,
 * sampleRate, ... } } for each chunk of assistant text. We forward the text to
 * Hakim's OpenAI-compatible TTS (/v1/audio/speech) and stream the raw PCM
 * straight back — which is exactly the headerless 16-bit signed LE mono PCM
 * Vapi's custom-voice contract requires.
 *
 * This swaps the robotic ElevenLabs/Azure voice for Hakim's native Gulf-Arabic
 * voice WITHOUT touching the Claude brain (the custom-LLM at
 * /api/voice/chat/completions) or telephony — Vapi keeps doing those.
 *
 * Configure in Vapi: Assistant > Voice > Custom Voice
 *   url    = https://<domain>/api/voice/tts
 *   header = x-vapi-secret: <VAPI_TTS_SECRET>   (we own the auth header because
 *            Vapi's default auth header for custom-voice is undocumented)
 * Always set a fallback voice in Vapi so a Hakim/proxy error doesn't drop calls.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Hakim regional base — KSA endpoint for lowest latency to Saudi telephony.
const HAKIM_BASE = process.env.HAKIM_TTS_BASE || "https://ksa.api.tryhakim.ai";
const HAKIM_MODEL = process.env.HAKIM_TTS_MODEL || "hakim-fast-v1";
const HAKIM_VOICE = process.env.HAKIM_TTS_VOICE || "reem-khaleeji";

// Vapi requests one of these rates; our returned PCM MUST match it exactly.
const ALLOWED_RATES = new Set([8000, 16000, 22050, 24000]);

// Health check — confirm the endpoint is live + which voice/model it serves.
export function GET() {
  return Response.json({
    ok: true,
    service: "hodoor-voice-tts",
    base: HAKIM_BASE,
    model: HAKIM_MODEL,
    voice: HAKIM_VOICE,
  });
}

export async function POST(req: Request) {
  // Optional shared secret. Set VAPI_TTS_SECRET in env and the same value as an
  // `x-vapi-secret` header in Vapi's custom-voice server config. (Kept separate
  // from the custom-LLM's VAPI_SECRET so enabling it can't break that route.)
  const secret = process.env.VAPI_TTS_SECRET;
  if (secret && req.headers.get("x-vapi-secret") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  const key = process.env.HAKIM_API_KEY;
  if (!key) {
    console.error("[voice-tts] missing HAKIM_API_KEY");
    return new Response("TTS not configured", { status: 500 });
  }

  let text = "";
  let sampleRate = 24000; // Hakim native; safe default if Vapi omits it
  try {
    const body = (await req.json()) as {
      message?: { text?: unknown; sampleRate?: unknown };
      text?: unknown;
      sampleRate?: unknown;
    };
    const m = body?.message ?? body;
    text = String(m?.text ?? "").trim();
    const sr = Number(m?.sampleRate);
    if (ALLOWED_RATES.has(sr)) sampleRate = sr;
  } catch {
    return new Response("invalid body", { status: 400 });
  }

  // Nothing to speak → return empty PCM (silence) so Vapi doesn't error out.
  if (!text) {
    return new Response(new Uint8Array(0), {
      status: 200,
      headers: { "Content-Type": "application/octet-stream" },
    });
  }

  let hakim: Response;
  try {
    hakim = await fetch(`${HAKIM_BASE}/v1/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: HAKIM_MODEL,
        voice: HAKIM_VOICE,
        input: text,
        response_format: "pcm", // headerless s16le mono — exactly Vapi's format
        sample_rate: sampleRate, // must equal Vapi's requested rate
        stream: true, // chunked; first audio ~113ms p95
      }),
    });
  } catch (e) {
    console.error("[voice-tts] hakim fetch failed:", e);
    return new Response("tts upstream error", { status: 502 });
  }

  if (!hakim.ok || !hakim.body) {
    const detail = await hakim.text().catch(() => "");
    console.error(`[voice-tts] hakim ${hakim.status}: ${detail.slice(0, 300)}`);
    // Non-200 → Vapi falls back to its configured fallback voice.
    return new Response("tts error", { status: 502 });
  }

  // Stream Hakim's raw PCM straight through to Vapi as application/octet-stream.
  return new Response(hakim.body, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
