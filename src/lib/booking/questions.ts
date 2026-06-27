import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

/**
 * Patient questions routed to the doctor. Captured by the agent (forward_question
 * tool) when a patient asks something medical/clinical it can't answer; the
 * receptionist/doctor answers or dismisses them from the dashboard.
 */
export type QuestionView = {
  id: string;
  patientPhone: string | null;
  patientName: string | null;
  channel: string;
  question: string;
  status: "open" | "answered" | "dismissed";
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
};

export async function addQuestion(args: {
  clinicId: string;
  owner: string;
  patientPhone?: string | null;
  patientName?: string | null;
  channel: "whatsapp" | "voice" | "manual";
  question: string;
}): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db || !args.question.trim()) return false;
  const { error } = await db.from("patient_questions").insert({
    clinic_id: args.clinicId,
    owner_id: args.owner,
    patient_phone: args.patientPhone || null,
    patient_name: args.patientName || null,
    channel: args.channel,
    question: args.question.trim().slice(0, 2000),
  });
  return !error;
}

export async function listQuestions(clinicId: string, owner: string): Promise<QuestionView[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];
  const { data } = await db
    .from("patient_questions")
    .select("id, patient_phone, patient_name, channel, question, status, answer, created_at, answered_at")
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner)
    .order("created_at", { ascending: false })
    .limit(200);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    patientPhone: (r.patient_phone as string | null) ?? null,
    patientName: (r.patient_name as string | null) ?? null,
    channel: String(r.channel ?? "whatsapp"),
    question: String(r.question ?? ""),
    status: (r.status as QuestionView["status"]) ?? "open",
    answer: (r.answer as string | null) ?? null,
    createdAt: String(r.created_at),
    answeredAt: (r.answered_at as string | null) ?? null,
  }));
}

export async function answerQuestion(
  id: string,
  clinicId: string,
  owner: string,
  answer: string,
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("patient_questions")
    .update({ status: "answered", answer: answer.trim().slice(0, 4000), answered_at: new Date().toISOString() })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner);
  return !error;
}

export async function dismissQuestion(id: string, clinicId: string, owner: string): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("patient_questions")
    .update({ status: "dismissed" })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner);
  return !error;
}
