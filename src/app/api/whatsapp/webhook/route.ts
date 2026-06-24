import { after } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ensureClinicContext } from "@/lib/booking/clinic";
import { runBookingAgent } from "@/lib/booking/agent";
import { loadSession, saveSession } from "@/lib/whatsapp/session";
import { sendText, markRead } from "@/lib/whatsapp/client";
import type { WhatsAppWebhook } from "@/lib/whatsapp/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET — webhook verification (Meta/360dialog sends hub.challenge)
// ---------------------------------------------------------------------------
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — incoming WhatsApp messages from Meta Cloud API
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!verifySignature(rawBody, req.headers.get("x-hub-signature-256") ?? "")) {
    return new Response("Forbidden", { status: 403 });
  }

  const payload = JSON.parse(rawBody) as WhatsAppWebhook;

  const jobs: Array<{ phoneNumberId: string; from: string; msgId: string; text: string }> = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const val = change.value;
      if (change.field !== "messages" || !val.messages) continue;
      const phoneNumberId = val.metadata.phone_number_id;
      for (const msg of val.messages) {
        if (msg.type !== "text" || !msg.text?.body) continue;
        jobs.push({ phoneNumberId, from: msg.from, msgId: msg.id, text: msg.text.body });
      }
    }
  }

  // Return 200 to Meta immediately, process after
  after(async () => {
    await Promise.all(jobs.map((j) => processMessage(j)));
  });

  return new Response("OK", { status: 200 });
}

// ---------------------------------------------------------------------------
// Core message processor
// ---------------------------------------------------------------------------
async function processMessage({
  phoneNumberId,
  from,
  msgId,
  text,
}: {
  phoneNumberId: string;
  from: string;
  msgId: string;
  text: string;
}) {
  await markRead(msgId, phoneNumberId);

  const owner = await resolveOwner(phoneNumberId);
  if (!owner) {
    console.warn(`[whatsapp] No clinic for phone_number_id=${phoneNumberId}`);
    return;
  }

  const ctx = await ensureClinicContext(owner);
  if (!ctx) return;

  const pastTurns = await loadSession(ctx.clinic.id, from);
  const turns = [...pastTurns, { role: "user" as const, content: text }];

  let reply = "";
  try {
    const result = await runBookingAgent({
      ctx,
      // Sonnet (not Haiku) for the live WhatsApp agent: booking is a critical
      // flow and needs strict tool discipline — never claim "booked" unless
      // book_appointment actually returned booked:true.
      model: "claude-sonnet-4-6",
      locale: "ar",
      turns,
      owner,
      patientPhone: from,
    });
    reply = result.reply;
    await saveSession(ctx.clinic.id, owner, from, [
      ...turns,
      { role: "assistant" as const, content: reply },
    ]);
  } catch (err) {
    console.error("[whatsapp] agent error:", err);
    reply = "عذراً، حدث خطأ. جرب مرة أخرى أو تواصل معنا مباشرة.";
  }

  await sendText(from, reply, phoneNumberId);
}

// ---------------------------------------------------------------------------
// Resolve which clinic owner should handle this message.
// In production: each clinic stores its whatsapp_phone_number_id (set in the
// dashboard's booking Setup tab). In sandbox: fall back to the single test
// number, routed to WHATSAPP_SANDBOX_OWNER_ID.
// ---------------------------------------------------------------------------
async function resolveOwner(phoneNumberId: string): Promise<string | null> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from("clinics")
      .select("owner_id")
      .eq("whatsapp_phone_number_id", phoneNumberId)
      .maybeSingle();
    if (data?.owner_id) return data.owner_id as string;
  }
  // Sandbox fallback — set WHATSAPP_SANDBOX_OWNER_ID to your Clerk user ID
  return process.env.WHATSAPP_SANDBOX_OWNER_ID ?? null;
}

// ---------------------------------------------------------------------------
// Signature verification.
// Meta signs the raw body with HMAC-SHA256 using the App Secret as the key,
// sent in X-Hub-Signature-256 as "sha256=<hex>". In dev the secret may be
// absent — skip verification only then (never in production).
// ---------------------------------------------------------------------------
function verifySignature(body: string, header: string): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const expected = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}
