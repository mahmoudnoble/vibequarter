import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ensureClinicContext } from "@/lib/booking/clinic";
import { runBookingAgent } from "@/lib/booking/agent";
import type { ChatTurn } from "@/lib/booking/types";

// INSTANT acknowledgement — deterministic, ZERO model latency. Picks a natural
// "one moment" line from keywords in the caller's last utterance, so the caller
// hears a fitting reply the millisecond they stop talking. Putting an LLM here
// (even a small one) was the lag: it gated the whole turn behind ~1s.
function instantFiller(text: string): string {
  const t = (text || "").toLowerCase();
  const has = (...ws: string[]) => ws.some((w) => t.includes(w));
  // Closing / thanks / goodbye → NO filler; the agent just says a short farewell,
  // so "لحظة من فضلك..." there is pointless (and felt repetitive).
  if (has("شكر", "مشكور", "تسلم", "سلامة", "مع السلامة", "باي", "thank", "bye", "العافية", "تمام خلاص", "خلاص يكفي")) return "";
  // Otherwise a brief filler that covers the agent's lookup (~2s) without dragging.
  if (has("كنسل", "الغاء", "الغي", "إلغاء", "ألغي", "امسح", "cancel")) return "لحظة أراجع لك موعدك،";
  if (has("غيّر", "غير", "أغير", "اغير", "اجل", "أجل", "تأجيل", "أعدل", "اعدل", "reschedule", "change")) return "ثانية أعدّل لك الموعد،";
  if (has("سعر", "بكام", "كام", "تكلفة", "price", "cost")) return "لحظة أشوف لك التفاصيل،";
  if (has("حجز", "احجز", "أحجز", "موعد", "ميعاد", "book", "appointment")) return "لحظة أشوف لك المواعيد،";
  return "ثانية واحدة،";
}

/** Map Arabic-Indic / Persian digits to Latin so phone numbers parse either way. */
function toLatinDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (d) => {
    const code = d.charCodeAt(0);
    return String(code <= 0x0669 ? code - 0x0660 : code - 0x06f0);
  });
}

/** Recover the patient's phone from a number they said earlier in the call, so
 *  the appointment lookup is stable across turns when the call carries no id. */
function extractPhoneFromTurns(turns: ChatTurn[]): string | undefined {
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].role !== "user") continue;
    // Join digits split by spaces/dashes ("973 3870 5548" → "97338705548").
    const joined = toLatinDigits(turns[i].content).replace(/(?<=\d)[\s-]+(?=\d)/g, "");
    const runs = joined.match(/\d{7,15}/g);
    if (runs && runs.length) return runs[runs.length - 1];
  }
  return undefined;
}

/**
 * Voice channel — Vapi "Custom LLM" endpoint (OpenAI-compatible /chat/completions).
 *
 * Vapi handles telephony + STT (caller speech → text) + TTS (our text → speech).
 * The BRAIN stays ours: this route maps Vapi's OpenAI-format transcript onto the
 * SAME booking agent + tools that already run on WhatsApp (check_availability /
 * book_appointment / cancel_appointment → Supabase). No new brain, no tools
 * duplicated — voice is just another channel.
 *
 * Configure in Vapi as Custom LLM URL = https://<domain>/api/voice
 * (Vapi appends /chat/completions). It's stateless: Vapi sends the full message
 * history each turn, so we don't persist sessions here.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // the agent may run a few tool rounds per turn

type OpenAiMessage = { role: string; content: unknown };

// Health check — lets us confirm the endpoint is live before wiring Vapi.
export function GET() {
  return new Response(JSON.stringify({ ok: true, service: "hodoor-voice" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  // Optional shared secret (set VAPI_SECRET + the same value in Vapi headers).
  const secret = process.env.VAPI_SECRET;
  if (secret && req.headers.get("x-vapi-secret") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  let payload: { messages?: OpenAiMessage[]; call?: { customer?: { number?: string } }; customer?: { number?: string } };
  try {
    payload = await req.json();
  } catch {
    return openAiError("invalid JSON body");
  }

  // Map Vapi's OpenAI transcript → our ChatTurn[] (drop Vapi's own system/tool msgs).
  const turns: ChatTurn[] = (payload.messages ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: textOf(m.content).trim() }))
    .filter((t) => t.content);

  // The patient's phone: the caller ID if present, ELSE a number they said
  // earlier in THIS call — so the booking lookup stays consistent every turn (a
  // web/forwarded call often carries no caller id, which made the agent "forget"
  // the appointment it had just looked up).
  const callerRaw = payload.call?.customer?.number ?? payload.customer?.number ?? "";
  const patientPhone = callerRaw.replace(/[^0-9]/g, "") || extractPhoneFromTurns(turns) || undefined;

  // A Vapi ping that doesn't end with a fresh patient utterance → stay silent
  // (re-greeting on every such ping was the old repetition bug).
  if (turns.length > 0 && turns[turns.length - 1].role !== "user") {
    return streamCompletion("");
  }

  // Call-open greeting (no turns yet) — latency-tolerant; needs the clinic name.
  if (turns.length === 0) {
    const o = await resolveVoiceOwner();
    const c = o ? await ensureClinicContext(o) : null;
    return streamCompletion(`السلام عليكم، ${c?.clinic.name?.trim() || "العيادة"} معك، كيف أقدر أساعدك؟`);
  }

  // Log the STT transcript so we can judge Gulf-Arabic recognition quality.
  console.log(`[voice] heard: ${turns[turns.length - 1].content.slice(0, 160)}`);

  // Stream the agent's reply token-by-token (OpenAI chunks) so Vapi's TTS starts
  // speaking as soon as the first words generate — the big perceived-latency win.
  const id = `chatcmpl-${randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const chunk = (delta: object, finish: string | null) =>
    `data: ${JSON.stringify({
      id,
      object: "chat.completion.chunk",
      created,
      model: "hodoor-voice",
      choices: [{ index: 0, delta, finish_reason: finish }],
    })}\n\n`;

  const body = new ReadableStream({
    async start(controller) {
      let started = false;
      const enqueue = (text: string) => {
        if (!text) return;
        if (!started) {
          controller.enqueue(enc.encode(chunk({ role: "assistant" }, null)));
          started = true;
        }
        controller.enqueue(enc.encode(chunk({ content: text }, null)));
      };

      // 1) INSTANT filler — emitted with zero I/O so the caller hears a natural
      //    "one moment" the millisecond they finish speaking (empty on closings).
      const filler = instantFiller(turns[turns.length - 1].content);
      if (filler) enqueue(filler + " ");

      // 2) Resolve the clinic (DB) WHILE the filler audio plays — no lag.
      const owner = await resolveVoiceOwner();
      const ctx = owner ? await ensureClinicContext(owner) : null;
      if (!owner || !ctx) {
        console.warn("[voice] no clinic resolved");
        enqueue("عذراً، الخدمة غير متاحة حالياً، حاول لاحقاً.");
        controller.enqueue(enc.encode(chunk({}, "stop")));
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      // 3) The booking agent streams the real answer — nothing gates it, so it
      //    flows the moment the model produces tokens.
      let agentSpoke = false;
      try {
        const result = await runBookingAgent({
          ctx,
          locale: "ar", // model defaults to OPENAI_BOOKING_MODEL (gpt-4.1)
          turns,
          owner,
          patientPhone,
          spoken: true, // phone call → spell numbers/times as Arabic words for the TTS
          onText: (t) => {
            if (t) {
              agentSpoke = true;
              enqueue(t);
            }
          },
        });
        if (!agentSpoke) enqueue(result.reply || "تمام.");
      } catch (err) {
        console.error("[voice] agent error:", err);
        if (!agentSpoke) enqueue("عذراً، صار خطأ بسيط. ممكن تعيد كلامك؟");
      }
      console.log(`[voice] turn ok caller=${patientPhone ?? "?"} streamed=${started}`);

      controller.enqueue(enc.encode(chunk({}, "stop")));
      controller.enqueue(enc.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// ---------------------------------------------------------------------------
// Resolve which clinic answers. Pilot: a single demo clinic (the one already
// wired for WhatsApp). Override with VOICE_SANDBOX_OWNER_ID; multi-clinic later
// maps the Vapi number/assistant → clinic.
// ---------------------------------------------------------------------------
async function resolveVoiceOwner(): Promise<string | null> {
  if (process.env.VOICE_SANDBOX_OWNER_ID) return process.env.VOICE_SANDBOX_OWNER_ID;
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data } = await db
    .from("clinics")
    .select("owner_id")
    .not("whatsapp_phone_number_id", "is", null)
    .limit(1)
    .maybeSingle();
  return (data as { owner_id?: string } | null)?.owner_id ?? null;
}

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  // OpenAI multimodal arrays: [{type:'text', text:'…'}, …]
  if (Array.isArray(content)) {
    return content
      .map((p) => (p && typeof p === "object" && "text" in p ? String((p as { text: unknown }).text ?? "") : ""))
      .join(" ");
  }
  return "";
}

/** Return the reply as an OpenAI-compatible streamed chat completion (SSE). */
function streamCompletion(text: string): Response {
  const id = `chatcmpl-${randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const chunk = (delta: object, finish: string | null) =>
    `data: ${JSON.stringify({
      id,
      object: "chat.completion.chunk",
      created,
      model: "hodoor-voice",
      choices: [{ index: 0, delta, finish_reason: finish }],
    })}\n\n`;

  const stream = new ReadableStream({
    start(controller) {
      if (text) controller.enqueue(enc.encode(chunk({ role: "assistant", content: text }, null)));
      controller.enqueue(enc.encode(chunk({}, "stop")));
      controller.enqueue(enc.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function openAiError(message: string): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
