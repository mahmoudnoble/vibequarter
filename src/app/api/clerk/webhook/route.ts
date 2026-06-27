import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

// Clerk webhooks are signed with Svix and need the raw body + Node crypto.
export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Clerk -> Supabase user sync, event-driven (production).
//
// In dev we poll (scripts/sync-clerk-supabase.mjs) because localhost can't
// receive webhooks. In production Clerk POSTs here on every user change:
//   user.created / user.updated -> upsert into public.users
//   user.deleted                -> delete the row (no orphan left behind)
//
// Set CLERK_WEBHOOK_SECRET (the `whsec_...` signing secret from the Clerk
// Dashboard endpoint) on Vercel, and point the Clerk webhook at
//   https://<domain>/api/clerk/webhook
// subscribed to the user.* events. See the production launch checklist.
// ---------------------------------------------------------------------------

type ClerkEmail = { id: string; email_address?: string };
type ClerkUserData = {
  id: string;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
};
type ClerkEvent = { type: string; data: ClerkUserData };

// Svix signature scheme: HMAC-SHA256 over `${id}.${timestamp}.${body}` using the
// base64-decoded secret (the part after `whsec_`), compared base64 against any
// of the space-separated `v1,<sig>` entries in the svix-signature header.
function verifySvix(req: Request, body: string): boolean {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return false; // never accept unverified events

  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const sigHeader = req.headers.get("svix-signature");
  if (!id || !timestamp || !sigHeader) return false;

  // Reject stale deliveries (replay guard): 5-minute tolerance.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
  const expectedBuf = Buffer.from(expected);

  // Header may carry several versioned signatures: "v1,<sig> v1,<sig2>".
  for (const part of sigHeader.split(" ")) {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    const candidate = Buffer.from(sig);
    if (candidate.length === expectedBuf.length && timingSafeEqual(candidate, expectedBuf)) {
      return true;
    }
  }
  return false;
}

export async function POST(req: Request) {
  const body = await req.text();

  if (!verifySvix(req, body)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: ClerkEvent;
  try {
    event = JSON.parse(body) as ClerkEvent;
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    console.error("[clerk-webhook] Supabase service client unavailable");
    return new Response("Not configured", { status: 500 });
  }

  const { type, data } = event;
  try {
    if (type === "user.created" || type === "user.updated") {
      const primary =
        data.email_addresses?.find((e) => e.id === data.primary_email_address_id) ??
        data.email_addresses?.[0];
      const { error } = await supabase.from("users").upsert(
        {
          clerk_id: data.id,
          email: primary?.email_address ?? null,
          full_name: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
          image_url: data.image_url ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clerk_id" },
      );
      if (error) {
        console.error("[clerk-webhook] upsert error:", error.message);
        return new Response("DB error", { status: 500 });
      }
    } else if (type === "user.deleted") {
      // data.id is the deleted Clerk user id.
      const { error } = await supabase.from("users").delete().eq("clerk_id", data.id);
      if (error) {
        console.error("[clerk-webhook] delete error:", error.message);
        return new Response("DB error", { status: 500 });
      }
    }
    // Other event types (organization.*, session.*, …) are acknowledged but
    // not acted on yet. organization.deleted cleanup is a future enhancement.
  } catch (e) {
    console.error("[clerk-webhook] handler threw:", e);
    return new Response("Error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
