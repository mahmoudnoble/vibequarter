"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  createInvoiceAction,
  cancelInvoiceAction,
  getInvoiceQrAction,
} from "./booking-actions";
import type { AppointmentFull, ClinicTaxSettings, InvoiceView } from "@/lib/booking/types";

export function InvoicesPanel({
  initialInvoices,
  invoiceable,
  taxSettings,
}: {
  initialInvoices: InvoiceView[];
  invoiceable: AppointmentFull[];
  taxSettings: ClinicTaxSettings | null;
}) {
  const { t, locale } = useLanguage();
  const it = t.dashboard.booking.invoicesTab;
  const taxReady = Boolean(taxSettings?.legalName && taxSettings?.vatNumber);

  const [invoices, setInvoices] = useState<InvoiceView[]>(initialInvoices);
  const [available, setAvailable] = useState<AppointmentFull[]>(invoiceable);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<InvoiceView | null>(null);

  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const fmtDate = (iso: string) => dateFmt.format(new Date(iso));
  const money = (n: number, ccy: string) => `${n.toFixed(2)} ${ccy}`;

  async function onCancel(inv: InvoiceView) {
    if (!window.confirm(it.cancelConfirm)) return;
    const res = await cancelInvoiceAction(inv.id);
    if (res.ok) {
      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: "cancelled" } : i)),
      );
    }
  }

  return (
    <div className="py-2">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Icon name="ReceiptText" className="h-4 w-4 text-jade-600" />
          {it.heading}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {invoices.length}
          </span>
        </h2>
        {taxReady && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="cursor-pointer rounded-xl bg-jade-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-jade-600"
          >
            {it.newInvoice}
          </button>
        )}
      </div>

      {!taxReady ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-14 text-center">
          <Icon name="ReceiptText" className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">{it.needTaxTitle}</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">{it.needTaxBody}</p>
        </div>
      ) : (
        <>
          {showForm && (
            <NewInvoiceForm
              it={it}
              appointments={available}
              locale={locale}
              onClose={() => setShowForm(false)}
              onCreated={(inv) => {
                setInvoices((prev) => [inv, ...prev]);
                setAvailable((prev) => prev.filter((a) => a.id !== inv.appointmentId));
                setShowForm(false);
              }}
            />
          )}

          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Icon name="ReceiptText" className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="max-w-xs text-sm text-muted-foreground">{it.empty}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="font-mono" dir="ltr">{inv.invoiceNumber}</span>
                      {inv.status === "cancelled" && (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          {it.statusCancelled}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {inv.patientName || "—"} · {fmtDate(inv.issuedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold text-jade-700">
                      {money(inv.total, inv.currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewing(inv)}
                      className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {it.view}
                    </button>
                    {inv.status === "issued" && (
                      <button
                        type="button"
                        onClick={() => onCancel(inv)}
                        className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500/80 transition-colors hover:bg-red-500/10 hover:text-red-600"
                      >
                        {it.cancelInvoice}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {viewing && (
        <InvoiceModal invoice={viewing} it={it} fmtDate={fmtDate} money={money} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

type InvoiceI18n = ReturnType<typeof useLanguage>["t"]["dashboard"]["booking"]["invoicesTab"];

function NewInvoiceForm({
  it,
  appointments,
  locale,
  onClose,
  onCreated,
}: {
  it: InvoiceI18n;
  appointments: AppointmentFull[];
  locale: string;
  onClose: () => void;
  onCreated: (inv: InvoiceView) => void;
}) {
  const [appointmentId, setAppointmentId] = useState(appointments[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [includesVat, setIncludesVat] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const apptLabel = (a: AppointmentFull) => {
    const svc = locale === "ar" ? a.serviceNameAr : a.serviceNameEn;
    const when = new Date(a.startIso).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
    });
    return `${a.patientName}${svc ? ` · ${svc}` : ""} · ${when}`;
  };

  function submit() {
    const amt = Number(amount);
    if (!appointmentId || !Number.isFinite(amt) || amt <= 0) return;
    setError(null);
    startTransition(async () => {
      const res = await createInvoiceAction({
        appointmentId,
        amount: amt,
        amountIncludesVat: includesVat,
        notes: notes.trim() || undefined,
      });
      if (res.ok && res.invoice) {
        onCreated(res.invoice);
      } else if (res.error === "missing-vat-settings") {
        setError(it.errorVat);
      } else if (res.error === "already-invoiced") {
        setError(it.errorAlready);
      } else if (res.error === "appointment-not-completed") {
        setError(it.errorNotCompleted);
      } else {
        setError(it.errorGeneric);
      }
    });
  }

  if (appointments.length === 0) {
    return (
      <div className="mb-4 rounded-2xl border border-dashed border-border bg-card p-5 text-center">
        <p className="text-sm text-muted-foreground">{it.noCompleted}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {it.cancel}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-foreground">{it.selectAppointment}</label>
        <select
          value={appointmentId}
          onChange={(e) => setAppointmentId(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-jade-500/50"
        >
          {appointments.map((a) => (
            <option key={a.id} value={a.id}>
              {apptLabel(a)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">{it.amountLabel}</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            dir="ltr"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-jade-500/50"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2.5">
          <input
            type="checkbox"
            checked={includesVat}
            onChange={(e) => setIncludesVat(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded accent-jade-500"
          />
          <span className="text-xs text-muted-foreground">{it.inclusiveLabel}</span>
        </label>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-foreground">{it.notesLabel}</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-jade-500/50"
        />
      </div>
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !(Number(amount) > 0)}
          className="cursor-pointer rounded-lg bg-jade-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-jade-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? it.creating : it.create}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {it.cancel}
        </button>
      </div>
    </div>
  );
}

function InvoiceModal({
  invoice,
  it,
  fmtDate,
  money,
  onClose,
}: {
  invoice: InvoiceView;
  it: InvoiceI18n;
  fmtDate: (iso: string) => string;
  money: (n: number, ccy: string) => string;
  onClose: () => void;
}) {
  const [qr, setQr] = useState<string | null>(null);

  // Generate the ZATCA QR image on open (server-side, from the stored payload).
  useEffect(() => {
    let active = true;
    getInvoiceQrAction(invoice.id).then((res) => {
      if (active) setQr(res.ok && res.dataUrl ? res.dataUrl : "");
    });
    return () => {
      active = false;
    };
  }, [invoice.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-mono text-sm font-bold text-foreground" dir="ltr">
            {invoice.invoiceNumber}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={it.close}
          >
            <Icon name="X" className="h-4 w-4" />
          </button>
        </div>

        {invoice.patientName && (
          <p className="mb-3 text-sm text-foreground">{invoice.patientName}</p>
        )}

        <dl className="space-y-1.5 text-sm">
          <Row label={it.subtotal} value={money(invoice.subtotal, invoice.currency)} />
          <Row
            label={`${it.vat} (${invoice.vatRate}%)`}
            value={money(invoice.vatAmount, invoice.currency)}
          />
          <div className="my-2 border-t border-border" />
          <Row label={it.total} value={money(invoice.total, invoice.currency)} strong />
        </dl>

        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-muted/40 p-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Icon name="QrCode" className="h-3.5 w-3.5" />
            {it.qrTitle}
          </span>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={it.qrTitle} width={180} height={180} className="rounded-lg bg-white p-1.5" />
          ) : (
            <div className="flex h-[180px] w-[180px] items-center justify-center">
              <Icon name="Loader2" className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {it.issuedAt}: {fmtDate(invoice.issuedAt)}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-mono", strong ? "text-base font-bold text-jade-700" : "text-foreground")} dir="ltr">
        {value}
      </dd>
    </div>
  );
}
