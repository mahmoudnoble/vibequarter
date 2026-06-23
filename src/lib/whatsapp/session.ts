import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { ChatTurn } from "@/lib/booking/types";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours of inactivity resets conversation

/** Load the saved conversation turns for a patient. Returns [] on first contact or after TTL. */
export async function loadSession(
  clinicId: string,
  patientPhone: string,
): Promise<ChatTurn[]> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("whatsapp_sessions")
    .select("turns, last_message_at")
    .eq("clinic_id", clinicId)
    .eq("patient_phone", patientPhone)
    .maybeSingle();

  if (!data) return [];

  const expired = Date.now() - new Date(data.last_message_at).getTime() > SESSION_TTL_MS;
  if (expired) return [];

  return (data.turns as ChatTurn[]) ?? [];
}

/** Persist updated turns after each agent response. */
export async function saveSession(
  clinicId: string,
  ownerId: string,
  patientPhone: string,
  turns: ChatTurn[],
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return;

  await supabase.from("whatsapp_sessions").upsert(
    {
      clinic_id: clinicId,
      owner_id: ownerId,
      patient_phone: patientPhone,
      turns,
      last_message_at: new Date().toISOString(),
    },
    { onConflict: "clinic_id,patient_phone" },
  );
}
