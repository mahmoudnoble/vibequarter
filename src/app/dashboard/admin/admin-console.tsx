"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/language-provider";
import { createClinicAction, type CreateClinicResult } from "./admin-actions";
import type { ClinicUsage } from "@/lib/admin/usage";

const STR = {
  en: {
    title: "Clinics", subtitle: "Manage every clinic and watch usage across the platform.",
    newClinic: "New clinic", empty: "No clinics yet. Create your first one.",
    clinic: "Clinic", bookings: "Bookings", completed: "Completed", invoices: "Invoices",
    revenue: "Revenue", patients: "Patients", convos: "Chats", callsCol: "Calls", status: "Status",
    active: "Active", paused: "Paused", whatsapp: "WhatsApp", calls: "WhatsApp + Calls",
    create: "Create clinic", creating: "Creating…", cancel: "Cancel",
    nameLabel: "Clinic name", phoneLabel: "WhatsApp Phone Number ID",
    scopeLabel: "Channels (scope)", vapiAssistant: "Vapi assistant ID", vapiNumber: "Vapi phone-number ID",
    vapiE164: "Clinic phone number", recHeading: "Receptionist login (optional)",
    email: "Email", password: "Password",
    recHint: "The client signs in with this email + password. You can add a receptionist later too.",
    createdOk: "Clinic created.", recOk: "Receptionist created:", recFail: "Clinic created, but the receptionist wasn't:",
    nameReq: "Enter a clinic name.",
  },
  ar: {
    title: "العيادات", subtitle: "أدر كل العيادات وتابع الاستهلاك عبر المنصة.",
    newClinic: "عيادة جديدة", empty: "لا عيادات بعد. أنشئ أول عيادة.",
    clinic: "العيادة", bookings: "الحجوزات", completed: "مكتملة", invoices: "الفواتير",
    revenue: "الإيراد", patients: "المرضى", convos: "محادثات", callsCol: "مكالمات", status: "الحالة",
    active: "نشطة", paused: "موقوفة", whatsapp: "واتساب", calls: "واتساب + مكالمات",
    create: "إنشاء العيادة", creating: "جاري الإنشاء…", cancel: "إلغاء",
    nameLabel: "اسم العيادة", phoneLabel: "معرّف رقم واتساب",
    scopeLabel: "القنوات (النطاق)", vapiAssistant: "Vapi assistant ID", vapiNumber: "Vapi phone-number ID",
    vapiE164: "رقم تليفون العيادة", recHeading: "حساب موظف الاستقبال (اختياري)",
    email: "الإيميل", password: "كلمة المرور",
    recHint: "العميل بيدخل بالإيميل ده + كلمة المرور. تقدر تضيف موظفًا لاحقًا.",
    createdOk: "تم إنشاء العيادة.", recOk: "تم إنشاء حساب الموظف:", recFail: "اتعملت العيادة، لكن حساب الموظف لأ:",
    nameReq: "أدخل اسم العيادة.",
  },
};

export function AdminConsole({ clinics: initial }: { clinics: ClinicUsage[] }) {
  const { locale } = useLanguage();
  const L = STR[locale === "ar" ? "ar" : "en"];
  const [clinics] = useState<ClinicUsage[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const money = (n: number) => (n ? `${n.toFixed(0)}` : "0");

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{L.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{L.subtitle}</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="shrink-0 cursor-pointer rounded-xl bg-jade-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jade-600"
          >
            + {L.newClinic}
          </button>
        )}
      </header>

      {showForm && <CreateClinicForm L={L} onClose={() => setShowForm(false)} />}

      {clinics.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Icon name="Building2" className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="max-w-xs text-sm text-muted-foreground">{L.empty}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-semibold">{L.clinic}</th>
                <th className="px-3 py-3 text-center font-semibold">{L.bookings}</th>
                <th className="px-3 py-3 text-center font-semibold">{L.completed}</th>
                <th className="px-3 py-3 text-center font-semibold">{L.invoices}</th>
                <th className="px-3 py-3 text-center font-semibold">{L.revenue}</th>
                <th className="px-3 py-3 text-center font-semibold">{L.patients}</th>
                <th className="px-3 py-3 text-center font-semibold">{L.convos}</th>
                <th className="px-3 py-3 text-center font-semibold">{L.callsCol}</th>
                <th className="px-4 py-3 text-center font-semibold">{L.status}</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((c) => (
                <tr key={c.clinicId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{c.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.scope === "whatsapp_calls" ? L.calls : L.whatsapp}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-foreground">{c.bookingsTotal}</td>
                  <td className="px-3 py-3 text-center text-foreground">{c.bookingsCompleted}</td>
                  <td className="px-3 py-3 text-center text-foreground">{c.invoicesCount}</td>
                  <td className="px-3 py-3 text-center font-semibold text-jade-700">{money(c.revenue)}</td>
                  <td className="px-3 py-3 text-center text-foreground">{c.patientsCount}</td>
                  <td className="px-3 py-3 text-center text-foreground">{c.conversations}</td>
                  <td className="px-3 py-3 text-center text-foreground">{c.calls}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        c.status === "paused"
                          ? "bg-amber-500/12 text-amber-700"
                          : "bg-jade-500/12 text-jade-700",
                      )}
                    >
                      {c.status === "paused" ? L.paused : L.active}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateClinicForm({ L, onClose }: { L: (typeof STR)["en"]; onClose: () => void }) {
  const [name, setName] = useState("");
  const [waPnId, setWaPnId] = useState("");
  const [scope, setScope] = useState<"whatsapp" | "whatsapp_calls">("whatsapp");
  const [vapiAssistant, setVapiAssistant] = useState("");
  const [vapiNumber, setVapiNumber] = useState("");
  const [vapiE164, setVapiE164] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<CreateClinicResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) {
      setError(L.nameReq);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createClinicAction({
        name,
        whatsappPhoneNumberId: waPnId || undefined,
        scope,
        vapiAssistantId: vapiAssistant || undefined,
        vapiPhoneNumberId: vapiNumber || undefined,
        vapiPhoneE164: vapiE164 || undefined,
        receptionistEmail: email || undefined,
        receptionistPassword: password || undefined,
      });
      setResult(res);
      if (!res.ok) setError(res.error ?? "error");
    });
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-jade-500/50 focus:ring-2 focus:ring-jade-500/20";
  const label = "mb-1.5 block text-xs font-semibold text-foreground";

  if (result?.ok) {
    return (
      <div className="mb-6 rounded-2xl border border-jade-500/40 bg-jade-500/5 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-jade-700">
          <Icon name="CheckCircle2" className="h-4 w-4" /> {L.createdOk}
        </p>
        {result.receptionist && (
          <p className="mt-2 text-sm text-foreground">
            {L.recOk} <span className="font-mono">{result.receptionist.email}</span>
          </p>
        )}
        {result.receptionistError && (
          <p className="mt-2 text-sm text-amber-700">
            {L.recFail} {result.receptionistError}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 cursor-pointer rounded-xl bg-jade-500 px-4 py-2 text-sm font-semibold text-white hover:bg-jade-600"
        >
          {L.cancel}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>{L.nameLabel}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>{L.phoneLabel}</label>
          <input value={waPnId} onChange={(e) => setWaPnId(e.target.value)} dir="ltr" className={cn(field, "font-mono")} />
        </div>
      </div>
      <div>
        <label className={label}>{L.scopeLabel}</label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as "whatsapp" | "whatsapp_calls")}
          className={field}
        >
          <option value="whatsapp">{L.whatsapp}</option>
          <option value="whatsapp_calls">{L.calls}</option>
        </select>
      </div>
      {scope === "whatsapp_calls" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={label}>{L.vapiAssistant}</label>
            <input value={vapiAssistant} onChange={(e) => setVapiAssistant(e.target.value)} dir="ltr" className={cn(field, "font-mono")} />
          </div>
          <div>
            <label className={label}>{L.vapiNumber}</label>
            <input value={vapiNumber} onChange={(e) => setVapiNumber(e.target.value)} dir="ltr" className={cn(field, "font-mono")} />
          </div>
          <div>
            <label className={label}>{L.vapiE164}</label>
            <input value={vapiE164} onChange={(e) => setVapiE164(e.target.value)} dir="ltr" className={cn(field, "font-mono")} placeholder="+9665…" />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
        <p className="mb-2 text-xs font-semibold text-foreground">{L.recHeading}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={L.email} type="email" dir="ltr" className={field} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={L.password} type="text" dir="ltr" className={field} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{L.recHint}</p>
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !name.trim()}
          className="cursor-pointer rounded-xl bg-jade-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jade-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? L.creating : L.create}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {L.cancel}
        </button>
      </div>
    </div>
  );
}
