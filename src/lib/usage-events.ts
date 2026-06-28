import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

/**
 * Append-only usage counter. Best-effort — never let usage bookkeeping break the
 * flow it measures. Bookings/invoices/patients/conversations are already counted
 * from their own tables (clinic_usage_summary); this captures what those can't,
 * e.g. voice call volume.
 */
export type UsageKind = "message_in" | "message_out" | "call" | "booking" | "invoice" | "campaign_send";

export async function recordUsage(kind: UsageKind, owner: string, clinicId?: string | null): Promise<void> {
  const db = getSupabaseServiceClient();
  if (!db || !owner) return;
  try {
    await db.from("usage_events").insert({ owner_id: owner, clinic_id: clinicId ?? null, kind });
  } catch {
    /* swallow — usage recording must never affect the caller */
  }
}
