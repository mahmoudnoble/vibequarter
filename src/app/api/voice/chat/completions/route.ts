import { randomUUID } from "crypto";
import { chatCompletion } from "@/lib/llm/openai";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ensureClinicContext } from "@/lib/booking/clinic";
import { runBookingAgent } from "@/lib/booking/agent";
import type { ChatTurn } from "@/lib/booking/types";

const ACK_SYSTEM =
  "You are a clinic phone receptionist. The patient just spoke. Reply with ONE very short sentence, in the SAME language and dialect they used (Egyptian/Gulf/Levantine Arabic, English, anything), that shows you heard and are on it — briefly restate their request. Do NOT answer, list options, ask anything, or book. Examples: «تمام، تبغى موعد ليزر، ثانية أشوف لك» / «حاضر يا فندم، لحظة أراجع لك المواعيد» / 'sure, one moment while I check'.";

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

  const owner = await resolveVoiceOwner();
  if (!owner) {
    console.warn("[voice] no clinic resolved");
    return streamCompletion("عذراً، الخدمة غير متاحة حالياً. حاول لاحقاً.");
  }

  const ctx = await ensureClinicContext(owner);
  if (!ctx) return streamCompletion("عذراً، حدث خطأ. حاول لاحقاً.");

  // The caller's number — makes the agent patient-aware (reschedule/cancel).
  const callerRaw = payload.call?.customer?.number ?? payload.customer?.number ?? "";
  const patientPhone = callerRaw.replace(/[^0-9]/g, "") || undefined;

  // Map Vapi's OpenAI transcript → our ChatTurn[] (drop Vapi's own system/tool msgs).
  const turns: ChatTurn[] = (payload.messages ?? [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: textOf(m.content).trim() }))
    .filter((t) => t.content);

  // Greet ONCE, only at the very start of the call. For any other request that
  // doesn't end with a fresh patient utterance (Vapi pings / silence), stay
  // silent — re-greeting on every such call was the repetition bug.
  if (turns.length === 0) {
    return streamCompletion(`السلام عليكم، ${ctx.clinic.name?.trim() || "العيادة"} معك، كيف أقدر أساعدك؟`);
  }
  if (turns[turns.length - 1].role !== "user") {
    return streamCompletion("");
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
      const push = (text: string) => {
        if (!text) return;
        if (!started) {
          controller.enqueue(enc.encode(chunk({ role: "assistant" }, null)));
          started = true;
        }
        controller.enqueue(enc.encode(chunk({ content: text }, null)));
      };
      try {
        // STAGE 1 — instant acknowledgement (fast Haiku), streamed first so the
        // caller is reassured the MOMENT they finish, BEFORE the slower booking
        // work runs. Restates their request in their own language/dialect.
        try {
          await chatCompletion({
            model: process.env.OPENAI_ACK_MODEL || "gpt-4o-mini",
            maxTokens: 40,
            messages: [
              { role: "system", content: ACK_SYSTEM },
              { role: "user", content: turns[turns.length - 1].content },
            ],
            onText: (d) => push(d),
          });
          push(" ");
        } catch (e) {
          console.error("[voice] ack failed:", e);
        }

        // STAGE 2 — the real booking agent (checks availability, books, etc.).
        const result = await runBookingAgent({
          ctx,
          locale: "ar", // model defaults to OPENAI_BOOKING_MODEL (gpt-4o)
          turns,
          owner,
          patientPhone,
          onText: push,
        });
        if (!started) push(result.reply || "تمام.");
        console.log(`[voice] turn ok caller=${patientPhone ?? "?"} streamed=${started}`);
      } catch (err) {
        console.error("[voice] agent error:", err);
        if (!started) push("عذراً، صار خطأ بسيط. ممكن تعيد كلامك؟");
      }
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
