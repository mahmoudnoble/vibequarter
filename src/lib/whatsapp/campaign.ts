import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { sendTemplate } from "./client";

/**
 * Bulk WhatsApp campaign (mini-CRM). Meta only allows free-form messages inside
 * the 24h window, so cold/bulk sends MUST use an APPROVED template — this sends
 * via sendTemplate per recipient and records each result. Capped + sequential;
 * a production-scale list should move to a queue/cron.
 */
const MAX_RECIPIENTS = 200;

export async function runCampaign(args: {
  clinicId: string;
  owner: string;
  phoneNumberId?: string;
  name: string;
  templateName: string;
  templateLang: string;
  bodyParams: string[];
  phones: string[];
}): Promise<{ ok: boolean; campaignId?: string; sent: number; failed: number; error?: string }> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, sent: 0, failed: 0, error: "no-db" };

  const phones = Array.from(new Set(args.phones.map((p) => p.trim()).filter(Boolean))).slice(0, MAX_RECIPIENTS);
  if (phones.length === 0) return { ok: false, sent: 0, failed: 0, error: "no-recipients" };
  if (!args.templateName.trim()) return { ok: false, sent: 0, failed: 0, error: "no-template" };

  const { data: camp, error: cErr } = await db
    .from("campaigns")
    .insert({
      clinic_id: args.clinicId,
      owner_id: args.owner,
      name: args.name.trim() || "Campaign",
      template_name: args.templateName.trim(),
      template_lang: args.templateLang || "ar",
      body_params: args.bodyParams,
      status: "sending",
      total: phones.length,
    })
    .select("id")
    .single();
  if (cErr || !camp) return { ok: false, sent: 0, failed: 0, error: "db-error" };
  const campaignId = (camp as { id: string }).id;

  let sent = 0;
  let failed = 0;
  for (const phone of phones) {
    let ok = false;
    let error: string | null = null;
    try {
      await sendTemplate(phone, args.templateName.trim(), args.templateLang || "ar", args.bodyParams, args.phoneNumberId);
      ok = true;
    } catch (e) {
      error = e instanceof Error ? e.message.slice(0, 300) : "send failed";
    }
    if (ok) sent++;
    else failed++;
    await db.from("campaign_recipients").insert({
      campaign_id: campaignId,
      owner_id: args.owner,
      patient_phone: phone,
      status: ok ? "sent" : "failed",
      error,
      sent_at: ok ? new Date().toISOString() : null,
    });
  }

  await db
    .from("campaigns")
    .update({ status: failed === phones.length ? "failed" : "sent", sent, failed, sent_at: new Date().toISOString() })
    .eq("id", campaignId);

  return { ok: true, campaignId, sent, failed };
}
