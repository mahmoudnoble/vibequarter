import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { WorkingHourInput, WorkingHourRow } from "./types";

/**
 * Agent answer-hours: when the AI picks up CALLS (distinct from bookable
 * working_hours). Mirrors the working_hours data layer. No rows for a clinic ⇒
 * always-on (the voice route treats an empty set as "always answer").
 */
export async function getAgentHours(clinicId: string, owner: string): Promise<WorkingHourRow[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];
  const { data } = await db
    .from("agent_hours")
    .select("weekday, open_time, close_time")
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner);
  return (data ?? []) as WorkingHourRow[];
}

export async function replaceAgentHours(
  clinicId: string,
  owner: string,
  inputs: WorkingHourInput[],
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  await db.from("agent_hours").delete().eq("clinic_id", clinicId).eq("owner_id", owner);
  const rows = inputs
    .filter((h) => h.is_open)
    .map((h) => ({
      clinic_id: clinicId,
      owner_id: owner,
      weekday: h.weekday,
      open_time: h.open_time + ":00",
      close_time: h.close_time + ":00",
    }));
  if (rows.length === 0) return true;
  const { error } = await db.from("agent_hours").insert(rows);
  return !error;
}
