"use server";

import { getOwner } from "@/lib/tenant";
import { getActiveModelForOwner } from "@/lib/subscriptions";
import {
  clearAppointments,
  ensureClinicContext,
  getUpcomingAppointments,
  toAppointmentViews,
  updateClinicInfo,
  upsertService,
  removeService,
  replaceWorkingHours,
  getAllAppointmentsFull,
  setAppointmentStatus,
  getAppointmentNotifyInfo,
  getPatients,
} from "@/lib/booking/clinic";
import { runBookingAgent } from "@/lib/booking/agent";
import { sendText } from "@/lib/whatsapp/client";
import type {
  AppointmentFull,
  AppointmentView,
  ChatTurn,
  PatientView,
  ServiceInput,
  WorkingHourInput,
} from "@/lib/booking/types";
import type { Locale } from "@/lib/plans";

const MAX_TURNS = 50;
const MAX_CONTENT = 4000;

export type BookingActionResult = {
  ok: boolean;
  reply: string;
  booked: boolean;
  appointments: AppointmentView[];
};

function sanitizeTurns(input: unknown): ChatTurn[] {
  if (!Array.isArray(input)) return [];
  const turns: ChatTurn[] = [];
  for (const raw of input.slice(-MAX_TURNS)) {
    const role = (raw as ChatTurn)?.role;
    const content = (raw as ChatTurn)?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const text = content.trim().slice(0, MAX_CONTENT);
    if (!text) continue;
    turns.push({ role, content: text });
  }
  return turns;
}

/**
 * Run one turn of the in-dashboard booking simulator. Stateless: the client
 * sends the plain chat transcript, the agent replays it, runs its grounded
 * booking tools server-side, and we return the reply plus the refreshed
 * upcoming-appointments list.
 */
export async function sendBookingMessage(args: {
  turns: ChatTurn[];
  locale: Locale;
}): Promise<BookingActionResult> {
  const owner = await getOwner();
  if (!owner) return { ok: false, reply: "", booked: false, appointments: [] };

  const turns = sanitizeTurns(args.turns);
  if (turns.length === 0 || turns[turns.length - 1].role !== "user") {
    return { ok: false, reply: "", booked: false, appointments: [] };
  }

  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false, reply: "", booked: false, appointments: [] };

  const locale: Locale = args.locale === "ar" ? "ar" : "en";

  try {
    const model = await getActiveModelForOwner(owner);
    const result = await runBookingAgent({ ctx, model, locale, turns, owner });
    const appts = await getUpcomingAppointments(ctx.clinic.id, owner);
    return {
      ok: true,
      reply: result.reply,
      booked: result.booked !== null,
      appointments: toAppointmentViews(appts, ctx.services),
    };
  } catch {
    const appts = await getUpcomingAppointments(ctx.clinic.id, owner);
    return {
      ok: false,
      reply: "",
      booked: false,
      appointments: toAppointmentViews(appts, ctx.services),
    };
  }
}

// ── management actions ───────────────────────────────────────────────────────

export async function saveClinicInfoAction(data: {
  name?: string;
  whatsappPhoneNumberId?: string;
}): Promise<{ ok: boolean }> {
  const owner = await getOwner();
  if (!owner) return { ok: false };
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false };
  const ok = await updateClinicInfo(ctx.clinic.id, owner, {
    name: data.name,
    whatsapp_phone_number_id: data.whatsappPhoneNumberId,
  });
  return { ok };
}

export async function saveServiceAction(input: ServiceInput): Promise<{ ok: boolean; id?: string }> {
  const owner = await getOwner();
  if (!owner) return { ok: false };
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false };
  return upsertService(ctx.clinic.id, owner, input);
}

export async function deleteServiceAction(serviceId: string): Promise<{ ok: boolean }> {
  const owner = await getOwner();
  if (!owner) return { ok: false };
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false };
  const ok = await removeService(serviceId, ctx.clinic.id, owner);
  return { ok };
}

export async function saveWorkingHoursAction(inputs: WorkingHourInput[]): Promise<{ ok: boolean }> {
  const owner = await getOwner();
  if (!owner) return { ok: false };
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false };
  const ok = await replaceWorkingHours(ctx.clinic.id, owner, inputs);
  return { ok };
}

export async function getFullAppointmentsAction(): Promise<AppointmentFull[]> {
  const owner = await getOwner();
  if (!owner) return [];
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return [];
  return getAllAppointmentsFull(ctx.clinic.id, owner);
}

export async function updateApptStatusAction(
  appointmentId: string,
  status: AppointmentFull["status"],
): Promise<{ ok: boolean }> {
  const owner = await getOwner();
  if (!owner) return { ok: false };
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false };

  // Grab contact info before the update so we can notify the patient.
  const info =
    status === "cancelled"
      ? await getAppointmentNotifyInfo(appointmentId, ctx.clinic.id, owner)
      : null;

  const ok = await setAppointmentStatus(appointmentId, ctx.clinic.id, owner, status);

  // When the clinic cancels from the dashboard, tell the patient on WhatsApp.
  // (Free-form text only delivers inside the 24h window; production needs an
  // approved template for older conversations.)
  if (
    ok &&
    status === "cancelled" &&
    info?.patientPhone &&
    ctx.clinic.whatsapp_phone_number_id
  ) {
    const when = new Intl.DateTimeFormat("ar-SA", {
      timeZone: ctx.clinic.timezone || "Asia/Riyadh",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(info.startIso));
    const clinicName = ctx.clinic.name?.trim() || "العيادة";
    const svc = info.serviceNameAr ? ` (${info.serviceNameAr})` : "";
    const body = `مرحباً 👋\nنأسف لإبلاغك أن موعدك في ${clinicName}${svc} يوم ${when} تم إلغاؤه.\nللحجز من جديد راسلنا في أي وقت ونحن سعداء بخدمتك. 🌟`;
    try {
      await sendText(info.patientPhone, body, ctx.clinic.whatsapp_phone_number_id);
    } catch (err) {
      console.error("[booking] cancel-notify failed:", err);
    }
  }

  return { ok };
}

export async function getPatientsAction(): Promise<PatientView[]> {
  const owner = await getOwner();
  if (!owner) return [];
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return [];
  return getPatients(ctx.clinic.id, owner);
}

// ── simulator ────────────────────────────────────────────────────────────────

/** Clear all of this clinic's simulated appointments (Reset button). */
export async function resetSimulator(): Promise<BookingActionResult> {
  const owner = await getOwner();
  if (!owner) return { ok: false, reply: "", booked: false, appointments: [] };
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false, reply: "", booked: false, appointments: [] };
  await clearAppointments(ctx.clinic.id, owner);
  return { ok: true, reply: "", booked: false, appointments: [] };
}
