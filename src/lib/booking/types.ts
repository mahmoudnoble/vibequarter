/**
 * Shared types for the booking core (clinic config + appointments) that powers
 * the AI booking agent and the in-dashboard chat simulator. Row types mirror the
 * Supabase tables; View types are the client-safe shapes sent to the browser.
 */

export type ClinicRow = {
  id: string;
  owner_id: string;
  name: string;
  whatsapp: string | null;
  timezone: string;
  booking_window_days: number;
  whatsapp_phone_number_id?: string | null;
};

export type ServiceRow = {
  id: string;
  clinic_id: string;
  owner_id: string;
  name_en: string;
  name_ar: string;
  duration_min: number;
  price: number | null;
  is_active: boolean;
  sort_order: number;
};

export type WorkingHourRow = {
  weekday: number; // 0 = Sunday .. 6 = Saturday (Postgres dow)
  open_time: string; // "HH:MM:SS"
  close_time: string; // "HH:MM:SS"
};

export type AppointmentRow = {
  id: string;
  clinic_id: string;
  owner_id: string;
  service_id: string | null;
  patient_name: string;
  patient_phone: string | null;
  starts_at: string; // ISO (UTC)
  ends_at: string; // ISO (UTC)
  status: string;
  source: string;
};

/** Everything the agent + availability engine need for one clinic. */
export type ClinicContext = {
  clinic: ClinicRow;
  services: ServiceRow[];
  hours: WorkingHourRow[];
};

/** A bookable time window, grounded in working hours + existing bookings. */
export type Slot = { start: string; end: string; label: string };

/** Grouped availability for one clinic-local day. */
export type DayAvailability = {
  date: string; // "YYYY-MM-DD" clinic-local
  weekday: number; // 0 = Sunday .. 6 = Saturday
  slots: Slot[];
};

/** Client-safe service shape for the simulator's "what it can book" panel. */
export type ServiceView = {
  id: string;
  nameEn: string;
  nameAr: string;
  durationMin: number;
  price: number | null;
};

/** Client-safe appointment shape for the simulator's upcoming list. */
export type AppointmentView = {
  id: string;
  patientName: string;
  serviceNameEn: string | null;
  serviceNameAr: string | null;
  startIso: string;
  endIso: string;
};

/** One plain chat turn exchanged with the simulator (no tool history). */
export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Rich appointment shape for the management dashboard (includes phone + status). */
export type AppointmentFull = {
  id: string;
  patientName: string;
  patientPhone: string | null;
  serviceNameEn: string | null;
  serviceNameAr: string | null;
  startIso: string;
  endIso: string;
  status: "booked" | "cancelled" | "completed" | "no_show";
  source: string;
};

/** Patient / lead row built from whatsapp_sessions. */
export type PatientView = {
  patientPhone: string;
  lastMessageAt: string;
  createdAt: string;
  turnCount: number;
};

/** Form input for creating / editing a service. */
export type ServiceInput = {
  id?: string;
  name_en: string;
  name_ar: string;
  duration_min: number;
  price: number | null;
};

/** Form input for a single day's working hours. */
export type WorkingHourInput = {
  weekday: number;
  is_open: boolean;
  open_time: string;  // "HH:MM"
  close_time: string; // "HH:MM"
};
