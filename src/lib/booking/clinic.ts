import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  AppointmentRow,
  AppointmentView,
  ClinicContext,
  ClinicRow,
  ServiceRow,
  ServiceView,
  WorkingHourRow,
} from "./types";

/**
 * Booking data layer. Writes go through the service-role client (stamping
 * owner_id + clinic_id from the trusted server session), matching the documented
 * pattern for onboarding/provisioning writes. RLS still protects any direct
 * tenant access.
 */

// Sensible med-spa / clinic starter menu so the simulator works on first load.
const DEFAULT_SERVICES: Array<Pick<ServiceRow, "name_en" | "name_ar" | "duration_min" | "price" | "sort_order">> = [
  { name_en: "General consultation", name_ar: "استشارة عامة", duration_min: 30, price: null, sort_order: 1 },
  { name_en: "Skin consultation", name_ar: "استشارة بشرة", duration_min: 30, price: null, sort_order: 2 },
  { name_en: "Facial cleansing", name_ar: "تنظيف بشرة", duration_min: 45, price: 350, sort_order: 3 },
  { name_en: "Botox session", name_ar: "جلسة بوتوكس", duration_min: 30, price: 900, sort_order: 4 },
  { name_en: "Filler session", name_ar: "جلسة فيلر", duration_min: 45, price: 1200, sort_order: 5 },
  { name_en: "Laser session", name_ar: "جلسة ليزر", duration_min: 30, price: 500, sort_order: 6 },
];

// Open Sat–Thu 10:00–22:00; Friday (weekday 5) closed. weekday: 0=Sun..6=Sat.
const DEFAULT_OPEN_DAYS = [6, 0, 1, 2, 3, 4];
const DEFAULT_OPEN = "10:00:00";
const DEFAULT_CLOSE = "22:00:00";

const CLINIC_COLS = "id, owner_id, name, whatsapp, timezone, booking_window_days, whatsapp_phone_number_id";

/**
 * Select-or-create the tenant's clinic and return everything the agent needs.
 * Idempotent: defaults (services + hours) are seeded only on first creation.
 */
export async function ensureClinicContext(owner: string): Promise<ClinicContext | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;

  let clinic: ClinicRow | null = null;
  const existing = await db.from("clinics").select(CLINIC_COLS).eq("owner_id", owner).maybeSingle();
  clinic = (existing.data as ClinicRow | null) ?? null;

  if (!clinic) {
    const created = await db
      .from("clinics")
      .insert({ owner_id: owner, name: "" })
      .select(CLINIC_COLS)
      .single();

    if (created.error || !created.data) {
      // Lost a creation race (owner_id is unique) — re-read the winner.
      const again = await db.from("clinics").select(CLINIC_COLS).eq("owner_id", owner).maybeSingle();
      clinic = (again.data as ClinicRow | null) ?? null;
    } else {
      clinic = created.data as ClinicRow;
      await Promise.all([
        db.from("clinic_services").insert(
          DEFAULT_SERVICES.map((s) => ({ ...s, clinic_id: clinic!.id, owner_id: owner })),
        ),
        db.from("working_hours").insert(
          DEFAULT_OPEN_DAYS.map((weekday) => ({
            clinic_id: clinic!.id,
            owner_id: owner,
            weekday,
            open_time: DEFAULT_OPEN,
            close_time: DEFAULT_CLOSE,
          })),
        ),
      ]);
    }
  }

  if (!clinic) return null;

  const [servicesRes, hoursRes] = await Promise.all([
    db
      .from("clinic_services")
      .select("id, clinic_id, owner_id, name_en, name_ar, duration_min, price, is_active, sort_order")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    db
      .from("working_hours")
      .select("weekday, open_time, close_time")
      .eq("clinic_id", clinic.id),
  ]);

  return {
    clinic,
    services: (servicesRes.data ?? []) as ServiceRow[],
    hours: (hoursRes.data ?? []) as WorkingHourRow[],
  };
}

/** Future booked appointments for a clinic, soonest first. */
export async function getUpcomingAppointments(
  clinicId: string,
  owner: string,
  limit = 30,
): Promise<AppointmentRow[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];
  const { data } = await db
    .from("appointments")
    .select("id, clinic_id, owner_id, service_id, patient_name, patient_phone, starts_at, ends_at, status, source")
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner)
    .eq("status", "booked")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);
  return (data ?? []) as AppointmentRow[];
}

/** This patient's upcoming booked appointments (by phone), soonest first. */
/** Significant phone digits (last 9) — lets "+966 50…", "966 50…", "050…"
 *  variants of the SAME number match, since callers and bookings store it
 *  in different formats. Returns "" when there aren't enough digits to be safe. */
export function phoneSuffix(phone: string | null | undefined): string {
  const d = (phone || "").replace(/\D/g, "");
  return d.length >= 7 ? d.slice(-9) : "";
}

export async function getPatientUpcomingAppointments(
  clinicId: string,
  owner: string,
  patientPhone: string,
): Promise<Array<{ id: string; serviceNameEn: string | null; serviceNameAr: string | null; startIso: string; patientName: string | null }>> {
  const db = getSupabaseServiceClient();
  const suffix = phoneSuffix(patientPhone);
  const searchDigits = (patientPhone || "").replace(/\D/g, "");
  if (!db || !suffix) return [];
  const [apptRes, svcRes] = await Promise.all([
    db
      .from("appointments")
      .select("id, service_id, starts_at, patient_name, patient_phone")
      .eq("clinic_id", clinicId)
      .eq("owner_id", owner)
      .like("patient_phone", `%${suffix}`)
      .eq("status", "booked")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }),
    db.from("clinic_services").select("id, name_en, name_ar").eq("clinic_id", clinicId),
  ]);
  const byId = new Map(
    ((svcRes.data ?? []) as Array<{ id: string; name_en: string; name_ar: string }>).map((s) => [s.id, s]),
  );
  return ((apptRes.data ?? []) as Array<{ id: string; service_id: string | null; starts_at: string; patient_name: string | null; patient_phone: string | null }>)
    // The last-9-digit LIKE is just a coarse filter — drop cross-country false
    // positives (e.g. 966…501234567 vs 971…501234567) by keeping only rows that
    // are genuinely the same number (one's digits is a suffix of the other's).
    .filter((r) => {
      const s = (r.patient_phone || "").replace(/\D/g, "");
      return s.endsWith(searchDigits) || searchDigits.endsWith(s);
    })
    .map((r) => {
      const svc = r.service_id ? byId.get(r.service_id) : undefined;
      return { id: r.id, serviceNameEn: svc?.name_en ?? null, serviceNameAr: svc?.name_ar ?? null, startIso: r.starts_at, patientName: r.patient_name ?? null };
    });
}

/** Cancel one appointment by id (agent-initiated). Returns true on success. */
export async function cancelAppointmentById(
  appointmentId: string,
  clinicId: string,
  owner: string,
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner)
    .eq("status", "booked");
  return !error;
}

/**
 * Insert a booked appointment. The DB exclusion constraint is the race-safe
 * lock: a colliding insert raises 23P01, which we surface as `conflict` so the
 * agent can apologise and offer another time.
 */
export async function insertBookedAppointment(args: {
  clinicId: string;
  owner: string;
  serviceId: string | null;
  patientName: string;
  patientPhone: string | null;
  startIso: string;
  endIso: string;
  source?: "simulator" | "whatsapp" | "manual";
}): Promise<{ ok: boolean; conflict?: boolean; row?: AppointmentRow }> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false };
  const { data, error } = await db
    .from("appointments")
    .insert({
      clinic_id: args.clinicId,
      owner_id: args.owner,
      service_id: args.serviceId,
      patient_name: args.patientName,
      patient_phone: args.patientPhone,
      starts_at: args.startIso,
      ends_at: args.endIso,
      status: "booked",
      source: args.source ?? "simulator",
    })
    .select("id, clinic_id, owner_id, service_id, patient_name, patient_phone, starts_at, ends_at, status, source")
    .single();

  if (error) {
    if (error.code === "23P01") return { ok: false, conflict: true };
    return { ok: false };
  }
  return { ok: true, row: data as AppointmentRow };
}

/** Delete every appointment for a clinic — powers the simulator's Reset button. */
export async function clearAppointments(clinicId: string, owner: string): Promise<void> {
  const db = getSupabaseServiceClient();
  if (!db) return;
  await db.from("appointments").delete().eq("clinic_id", clinicId).eq("owner_id", owner);
}

// ── management operations ───────────────────────────────────────────────────

export async function updateClinicInfo(
  clinicId: string,
  owner: string,
  data: { name?: string; whatsapp_phone_number_id?: string },
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("clinics")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", clinicId)
    .eq("owner_id", owner);
  return !error;
}

export async function upsertService(
  clinicId: string,
  owner: string,
  input: import("./types").ServiceInput,
): Promise<{ ok: boolean; id?: string }> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false };
  if (input.id) {
    const { error } = await db
      .from("clinic_services")
      .update({
        name_en: input.name_en,
        name_ar: input.name_ar,
        duration_min: input.duration_min,
        price: input.price,
      })
      .eq("id", input.id)
      .eq("clinic_id", clinicId)
      .eq("owner_id", owner);
    return error ? { ok: false } : { ok: true, id: input.id };
  }
  const { data: last } = await db
    .from("clinic_services")
    .select("sort_order")
    .eq("clinic_id", clinicId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await db
    .from("clinic_services")
    .insert({
      clinic_id: clinicId,
      owner_id: owner,
      name_en: input.name_en,
      name_ar: input.name_ar,
      duration_min: input.duration_min,
      price: input.price,
      is_active: true,
      sort_order: ((last as { sort_order?: number } | null)?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();
  return error ? { ok: false } : { ok: true, id: (data as { id: string }).id };
}

export async function removeService(
  serviceId: string,
  clinicId: string,
  owner: string,
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("clinic_services")
    .delete()
    .eq("id", serviceId)
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner);
  return !error;
}

export async function replaceWorkingHours(
  clinicId: string,
  owner: string,
  inputs: import("./types").WorkingHourInput[],
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  await db.from("working_hours").delete().eq("clinic_id", clinicId).eq("owner_id", owner);
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
  const { error } = await db.from("working_hours").insert(rows);
  return !error;
}

export async function getAllAppointmentsFull(
  clinicId: string,
  owner: string,
  limit = 100,
): Promise<import("./types").AppointmentFull[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];
  const [apptRes, svcRes] = await Promise.all([
    db
      .from("appointments")
      .select("id, service_id, patient_name, patient_phone, starts_at, ends_at, status, source")
      .eq("clinic_id", clinicId)
      .eq("owner_id", owner)
      .order("starts_at", { ascending: false })
      .limit(limit),
    db
      .from("clinic_services")
      .select("id, name_en, name_ar")
      .eq("clinic_id", clinicId),
  ]);
  const byId = new Map(
    ((svcRes.data ?? []) as Array<{ id: string; name_en: string; name_ar: string }>).map(
      (s) => [s.id, s],
    ),
  );
  return ((apptRes.data ?? []) as AppointmentRow[]).map((r) => {
    const svc = r.service_id ? byId.get(r.service_id) : undefined;
    return {
      id: r.id,
      patientName: r.patient_name,
      patientPhone: r.patient_phone,
      serviceNameEn: svc?.name_en ?? null,
      serviceNameAr: svc?.name_ar ?? null,
      startIso: r.starts_at,
      endIso: r.ends_at,
      status: r.status as import("./types").AppointmentFull["status"],
      source: r.source,
    };
  });
}

/** Contact + summary info for an appointment — used to notify the patient on WhatsApp. */
export async function getAppointmentNotifyInfo(
  appointmentId: string,
  clinicId: string,
  owner: string,
): Promise<{ patientPhone: string | null; startIso: string; serviceNameAr: string | null } | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data } = await db
    .from("appointments")
    .select("patient_phone, starts_at, service_id")
    .eq("id", appointmentId)
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner)
    .maybeSingle();
  if (!data) return null;
  const row = data as { patient_phone: string | null; starts_at: string; service_id: string | null };
  let serviceNameAr: string | null = null;
  if (row.service_id) {
    const { data: svc } = await db
      .from("clinic_services")
      .select("name_ar")
      .eq("id", row.service_id)
      .maybeSingle();
    serviceNameAr = (svc as { name_ar?: string } | null)?.name_ar ?? null;
  }
  return { patientPhone: row.patient_phone, startIso: row.starts_at, serviceNameAr };
}

export async function setAppointmentStatus(
  appointmentId: string,
  clinicId: string,
  owner: string,
  status: "booked" | "cancelled" | "completed" | "no_show",
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner);
  return !error;
}

export async function getPatients(
  clinicId: string,
  owner: string,
): Promise<import("./types").PatientView[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];
  const { data } = await db
    .from("whatsapp_sessions")
    .select("patient_phone, last_message_at, created_at, turns")
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner)
    .order("last_message_at", { ascending: false });
  return ((data ?? []) as Array<{
    patient_phone: string;
    last_message_at: string;
    created_at: string;
    turns: unknown[];
  }>).map((r) => ({
    patientPhone: r.patient_phone,
    lastMessageAt: r.last_message_at,
    createdAt: r.created_at,
    turnCount: Array.isArray(r.turns) ? r.turns.length : 0,
  }));
}

// ── client-safe view mappers ────────────────────────────────────────────────

export function toServiceViews(services: ServiceRow[]): ServiceView[] {
  return services.map((s) => ({
    id: s.id,
    nameEn: s.name_en,
    nameAr: s.name_ar,
    durationMin: s.duration_min,
    price: s.price == null ? null : Number(s.price),
  }));
}

export function toWorkingHourInputs(rows: WorkingHourRow[]): import("./types").WorkingHourInput[] {
  const byDay = new Map(rows.map((r) => [r.weekday, r]));
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const row = byDay.get(weekday);
    return {
      weekday,
      is_open: !!row,
      open_time: row ? row.open_time.slice(0, 5) : "09:00",
      close_time: row ? row.close_time.slice(0, 5) : "17:00",
    };
  });
}

export function toAppointmentViews(rows: AppointmentRow[], services: ServiceRow[]): AppointmentView[] {
  const byId = new Map(services.map((s) => [s.id, s]));
  return rows.map((r) => {
    const svc = r.service_id ? byId.get(r.service_id) : undefined;
    return {
      id: r.id,
      patientName: r.patient_name,
      serviceNameEn: svc?.name_en ?? null,
      serviceNameAr: svc?.name_ar ?? null,
      startIso: r.starts_at,
      endIso: r.ends_at,
    };
  });
}
