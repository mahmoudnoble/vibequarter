import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { buildZatcaQrPayload } from "@/lib/zatca/qr";
import { computeInvoiceAmounts, amountStr, formatInvoiceNumber } from "@/lib/zatca/invoice";
import type { InvoiceRow, InvoiceView } from "./types";

/**
 * ZATCA invoice data layer (Phase 1). Writes go through the service-role client
 * (stamping owner_id + clinic_id from the trusted server session). Invoice
 * amounts + the ZATCA TLV QR payload are computed here from the clinic's tax
 * identity (legal name + VAT number + rate).
 */

const INVOICE_COLS =
  "id, seq, invoice_number, appointment_id, patient_name, patient_phone, issued_at, currency, subtotal, vat_rate, vat_amount, total, qr_payload, status, notes";

export type CreateInvoiceError =
  | "no-db"
  | "no-clinic"
  | "missing-vat-settings"
  | "appointment-not-found"
  | "appointment-not-completed"
  | "already-invoiced"
  | "seq-conflict"
  | "db-error";

export type CreateInvoiceResult =
  | { ok: true; invoice: InvoiceView }
  | { ok: false; error: CreateInvoiceError };

export async function createInvoice(args: {
  clinicId: string;
  owner: string;
  appointmentId?: string | null;
  patientName?: string | null;
  patientPhone?: string | null;
  amount: number;
  amountIncludesVat: boolean;
  notes?: string | null;
}): Promise<CreateInvoiceResult> {
  const db = getSupabaseServiceClient();
  if (!db) return { ok: false, error: "no-db" };

  // Clinic tax identity — required for a compliant simplified-invoice QR.
  const { data: clinic } = await db
    .from("clinics")
    .select("name, legal_name, vat_number, vat_rate")
    .eq("id", args.clinicId)
    .eq("owner_id", args.owner)
    .maybeSingle();
  if (!clinic) return { ok: false, error: "no-clinic" };
  const c = clinic as { name: string; legal_name: string | null; vat_number: string | null; vat_rate: number | null };
  const sellerName = (c.legal_name || c.name || "").trim();
  const vatNumber = (c.vat_number || "").trim();
  if (!sellerName || !vatNumber) return { ok: false, error: "missing-vat-settings" };
  const vatRate = c.vat_rate == null ? 15 : Number(c.vat_rate);

  // An invoice may ONLY be issued for a COMPLETED appointment, and at most one
  // invoice per appointment. The patient identity is taken from the appointment
  // (trusted) rather than the client.
  let patientName = args.patientName ?? null;
  let patientPhone = args.patientPhone ?? null;
  if (args.appointmentId) {
    const { data: appt } = await db
      .from("appointments")
      .select("patient_name, patient_phone, status")
      .eq("id", args.appointmentId)
      .eq("clinic_id", args.clinicId)
      .eq("owner_id", args.owner)
      .maybeSingle();
    if (!appt) return { ok: false, error: "appointment-not-found" };
    const a = appt as { patient_name: string | null; patient_phone: string | null; status: string };
    if (a.status !== "completed") return { ok: false, error: "appointment-not-completed" };
    const { data: existing } = await db
      .from("invoices")
      .select("id")
      .eq("appointment_id", args.appointmentId)
      .eq("clinic_id", args.clinicId)
      .limit(1)
      .maybeSingle();
    if (existing) return { ok: false, error: "already-invoiced" };
    patientName = a.patient_name;
    patientPhone = a.patient_phone;
  }

  const amounts = computeInvoiceAmounts(args.amount, vatRate, args.amountIncludesVat);
  const issuedAt = new Date();
  const qrPayload = buildZatcaQrPayload({
    sellerName,
    vatNumber,
    timestampIso: issuedAt.toISOString(),
    totalWithVat: amountStr(amounts.total),
    vatTotal: amountStr(amounts.vatAmount),
  });

  // Next per-clinic sequence. Manual issuance by a single clinic makes a race
  // unlikely; the unique (clinic_id, seq) constraint is the backstop.
  const { data: last } = await db
    .from("invoices")
    .select("seq")
    .eq("clinic_id", args.clinicId)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  const seq = (((last as { seq?: number } | null)?.seq) ?? 0) + 1;

  const { data, error } = await db
    .from("invoices")
    .insert({
      clinic_id: args.clinicId,
      owner_id: args.owner,
      appointment_id: args.appointmentId ?? null,
      seq,
      invoice_number: formatInvoiceNumber(seq),
      patient_name: patientName,
      patient_phone: patientPhone,
      issued_at: issuedAt.toISOString(),
      subtotal: amounts.subtotal,
      vat_rate: vatRate,
      vat_amount: amounts.vatAmount,
      total: amounts.total,
      qr_payload: qrPayload,
      notes: args.notes ?? null,
    })
    .select(INVOICE_COLS)
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: "seq-conflict" };
    return { ok: false, error: "db-error" };
  }
  return { ok: true, invoice: toInvoiceView(toInvoiceRow(data)) };
}

export async function getInvoices(clinicId: string, owner: string, limit = 100): Promise<InvoiceView[]> {
  const db = getSupabaseServiceClient();
  if (!db) return [];
  const { data } = await db
    .from("invoices")
    .select(INVOICE_COLS)
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner)
    .order("issued_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown[]).map((r) => toInvoiceView(toInvoiceRow(r)));
}

export async function getInvoiceById(id: string, clinicId: string, owner: string): Promise<InvoiceView | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data } = await db
    .from("invoices")
    .select(INVOICE_COLS)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner)
    .maybeSingle();
  return data ? toInvoiceView(toInvoiceRow(data)) : null;
}

export async function setInvoiceStatus(
  id: string,
  clinicId: string,
  owner: string,
  status: "issued" | "cancelled",
): Promise<boolean> {
  const db = getSupabaseServiceClient();
  if (!db) return false;
  const { error } = await db
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .eq("owner_id", owner);
  return !error;
}

// ── mappers (numeric columns may arrive as strings via PostgREST) ────────────

function num(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

function toInvoiceRow(r: unknown): InvoiceRow {
  const o = r as Record<string, unknown>;
  return {
    id: String(o.id),
    seq: num(o.seq),
    invoice_number: String(o.invoice_number),
    appointment_id: (o.appointment_id as string | null) ?? null,
    patient_name: (o.patient_name as string | null) ?? null,
    patient_phone: (o.patient_phone as string | null) ?? null,
    issued_at: String(o.issued_at),
    currency: String(o.currency ?? "SAR"),
    subtotal: num(o.subtotal),
    vat_rate: num(o.vat_rate),
    vat_amount: num(o.vat_amount),
    total: num(o.total),
    qr_payload: String(o.qr_payload),
    status: (o.status as "issued" | "cancelled") ?? "issued",
    notes: (o.notes as string | null) ?? null,
  };
}

function toInvoiceView(r: InvoiceRow): InvoiceView {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number,
    appointmentId: r.appointment_id,
    patientName: r.patient_name,
    patientPhone: r.patient_phone,
    issuedAt: r.issued_at,
    currency: r.currency,
    subtotal: r.subtotal,
    vatRate: r.vat_rate,
    vatAmount: r.vat_amount,
    total: r.total,
    qrPayload: r.qr_payload,
    status: r.status,
  };
}
