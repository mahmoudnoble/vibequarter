import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { sendTemplate } from "@/lib/whatsapp/client";
import { localYmd, localMinutes, weekdayOf, parseHm, zonedWallToUtc } from "./availability";

/**
 * End-of-day auto-cancel. For each clinic, ONCE its working day has closed (in
 * the clinic's own timezone), cancel any of TODAY's appointments still 'booked'
 * (i.e. the patient never showed / wasn't marked complete) and message them to
 * rebook.
 *
 * SAFETY: it only ever touches appointments whose start is on the clinic-local
 * CURRENT day — never historical rows — and only after the day's last close
 * time, so it can't cancel an appointment the receptionist is about to complete.
 * Idempotent: the .eq('status','booked') filter means a re-run skips already-
 * cancelled rows. The WhatsApp notice needs an APPROVED template
 * (WHATSAPP_AUTOCANCEL_TEMPLATE); if unset, it cancels silently (no send).
 */
type ClinicRow = {
  id: string;
  owner_id: string;
  name: string | null;
  timezone: string | null;
  whatsapp_phone_number_id: string | null;
};

export async function runEndOfDayAutoCancel(now: Date = new Date()): Promise<{
  clinicsProcessed: number;
  cancelled: number;
  notified: number;
}> {
  const db = getSupabaseServiceClient();
  if (!db) return { clinicsProcessed: 0, cancelled: 0, notified: 0 };

  const { data: clinics } = await db
    .from("clinics")
    .select("id, owner_id, name, timezone, whatsapp_phone_number_id");

  const template = process.env.WHATSAPP_AUTOCANCEL_TEMPLATE;
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "ar";

  let clinicsProcessed = 0;
  let cancelled = 0;
  let notified = 0;

  for (const cRaw of (clinics ?? []) as ClinicRow[]) {
    const tz = cRaw.timezone || "Asia/Riyadh";
    const { y, mo, d } = localYmd(now, tz);
    const nowMin = localMinutes(now, tz);
    const weekday = weekdayOf(y, mo, d);

    // Day-end boundary = today's latest working-hours close (fallback 23:59).
    const { data: hours } = await db
      .from("working_hours")
      .select("weekday, close_time")
      .eq("clinic_id", cRaw.id);
    const todayCloses = (hours ?? [])
      .filter((h) => (h as { weekday: number }).weekday === weekday)
      .map((h) => parseHm((h as { close_time: string }).close_time));
    const boundary = todayCloses.length ? Math.max(...todayCloses) : 1439;
    if (nowMin < boundary) continue; // working day not over yet — leave bookings alone
    clinicsProcessed++;

    // Today's window in UTC: [clinic-local 00:00, now).
    const startTodayUtc = zonedWallToUtc(y, mo, d, 0, 0, tz).toISOString();
    const { data: appts } = await db
      .from("appointments")
      .select("id, patient_phone")
      .eq("clinic_id", cRaw.id)
      .eq("status", "booked")
      .gte("starts_at", startTodayUtc)
      .lt("ends_at", now.toISOString());

    for (const a of (appts ?? []) as Array<{ id: string; patient_phone: string | null }>) {
      const { error } = await db
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", a.id)
        .eq("status", "booked"); // idempotent guard
      if (error) continue;
      cancelled++;

      if (template && a.patient_phone && cRaw.whatsapp_phone_number_id) {
        try {
          await sendTemplate(
            a.patient_phone,
            template,
            lang,
            [cRaw.name?.trim() || "العيادة"],
            cRaw.whatsapp_phone_number_id,
          );
          notified++;
        } catch (e) {
          console.error("[auto-cancel] notify failed:", e);
        }
      }
    }
  }

  return { clinicsProcessed, cancelled, notified };
}
