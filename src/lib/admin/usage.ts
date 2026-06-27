import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

/**
 * Cross-clinic usage for the super-admin console. Reads the clinic_usage_summary
 * view via the service-role client (bypasses RLS by design — ALWAYS call behind
 * requireSuperAdmin()). Never expose to a receptionist path.
 */
export type ClinicUsage = {
  clinicId: string;
  ownerId: string;
  name: string;
  status: string;
  scope: string;
  timezone: string;
  bookingsTotal: number;
  bookingsBooked: number;
  bookingsCompleted: number;
  invoicesCount: number;
  revenue: number;
  patientsCount: number;
  conversations: number;
};

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));

export async function listClinicUsage(): Promise<ClinicUsage[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];
  const { data } = await db.from("clinic_usage_summary").select("*").order("name");
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    clinicId: String(r.clinic_id),
    ownerId: String(r.owner_id),
    name: String(r.name ?? ""),
    status: String(r.status ?? "active"),
    scope: String(r.scope ?? "whatsapp"),
    timezone: String(r.timezone ?? ""),
    bookingsTotal: num(r.bookings_total),
    bookingsBooked: num(r.bookings_booked),
    bookingsCompleted: num(r.bookings_completed),
    invoicesCount: num(r.invoices_count),
    revenue: num(r.revenue),
    patientsCount: num(r.patients_count),
    conversations: num(r.conversations),
  }));
}
