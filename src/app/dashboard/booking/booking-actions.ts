"use server";

import { getOwner } from "@/lib/tenant";
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
  getClinicTaxSettings,
  updateClinicTaxSettings,
} from "@/lib/booking/clinic";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  setInvoiceStatus,
} from "@/lib/booking/invoices";
import { runBookingAgent } from "@/lib/booking/agent";
import { sendText } from "@/lib/whatsapp/client";
import QRCode from "qrcode";
import type {
  AppointmentFull,
  AppointmentView,
  ChatTurn,
  ClinicTaxSettings,
  InvoiceView,
  PatientView,
  ServiceInput,
  WorkingHourInput,
} from "@/lib/booking/types";
import type { CreateInvoiceError } from "@/lib/booking/invoices";
import type { Locale } from "@/lib/i18n";

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
    const result = await runBookingAgent({ ctx, locale, turns, owner });
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

// ── ZATCA invoicing ──────────────────────────────────────────────────────────

export async function getTaxSettingsAction(): Promise<ClinicTaxSettings | null> {
  const owner = await getOwner();
  if (!owner) return null;
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return null;
  return getClinicTaxSettings(ctx.clinic.id, owner);
}

export async function saveTaxSettingsAction(data: {
  legalName?: string;
  vatNumber?: string;
  vatRate?: number;
}): Promise<{ ok: boolean }> {
  const owner = await getOwner();
  if (!owner) return { ok: false };
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false };
  const vatRate =
    typeof data.vatRate === "number" && data.vatRate >= 0 && data.vatRate <= 100
      ? data.vatRate
      : undefined;
  const ok = await updateClinicTaxSettings(ctx.clinic.id, owner, {
    legal_name: data.legalName?.trim() || null,
    vat_number: data.vatNumber?.replace(/\s/g, "") || null,
    vat_rate: vatRate,
  });
  return { ok };
}

export async function getInvoicesAction(): Promise<InvoiceView[]> {
  const owner = await getOwner();
  if (!owner) return [];
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return [];
  return getInvoices(ctx.clinic.id, owner);
}

export async function createInvoiceAction(data: {
  patientName?: string;
  patientPhone?: string;
  amount: number;
  amountIncludesVat: boolean;
  notes?: string;
}): Promise<{ ok: boolean; invoice?: InvoiceView; error?: CreateInvoiceError }> {
  const owner = await getOwner();
  if (!owner) return { ok: false, error: "no-db" };
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false, error: "no-clinic" };
  if (!Number.isFinite(data.amount) || data.amount <= 0) return { ok: false, error: "db-error" };
  const res = await createInvoice({
    clinicId: ctx.clinic.id,
    owner,
    patientName: data.patientName?.trim() || null,
    patientPhone: data.patientPhone?.trim() || null,
    amount: data.amount,
    amountIncludesVat: data.amountIncludesVat,
    notes: data.notes?.trim() || null,
  });
  return res.ok ? { ok: true, invoice: res.invoice } : { ok: false, error: res.error };
}

export async function cancelInvoiceAction(id: string): Promise<{ ok: boolean }> {
  const owner = await getOwner();
  if (!owner) return { ok: false };
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false };
  const ok = await setInvoiceStatus(id, ctx.clinic.id, owner, "cancelled");
  return { ok };
}

/** On-demand QR image (PNG data URL) for an invoice's ZATCA payload. */
export async function getInvoiceQrAction(id: string): Promise<{ ok: boolean; dataUrl?: string }> {
  const owner = await getOwner();
  if (!owner) return { ok: false };
  const ctx = await ensureClinicContext(owner);
  if (!ctx) return { ok: false };
  const invoice = await getInvoiceById(id, ctx.clinic.id, owner);
  if (!invoice) return { ok: false };
  try {
    const dataUrl = await QRCode.toDataURL(invoice.qrPayload, { margin: 1, width: 220 });
    return { ok: true, dataUrl };
  } catch {
    return { ok: false };
  }
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
