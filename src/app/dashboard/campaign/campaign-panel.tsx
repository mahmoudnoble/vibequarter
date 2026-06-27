"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/language-provider";
import { sendCampaignAction } from "../booking/booking-actions";
import type { PatientView } from "@/lib/booking/types";

const STR = {
  en: {
    title: "Campaign", subtitle: "Send a WhatsApp message to your patients.",
    empty: "No patients yet. They appear as people book.",
    recipients: "Recipients", selectAll: "Select all", selected: "selected",
    templateNote: "Bulk WhatsApp must use an APPROVED Meta template (free-form only delivers within 24h).",
    nameLabel: "Campaign name", templateLabel: "Template name", langLabel: "Language",
    paramsLabel: "Template values (comma-separated, fill {{1}}, {{2}}…)",
    send: "Send campaign", sending: "Sending…",
    needTemplate: "Enter the approved template name.", needRecipients: "Select at least one recipient.",
    result: "Sent {sent}, failed {failed}.", noName: "No name",
  },
  ar: {
    title: "الحملات", subtitle: "ابعت رسالة واتساب لمرضاك.",
    empty: "لا مرضى بعد. بيظهروا مع الحجوزات.",
    recipients: "المستلمون", selectAll: "تحديد الكل", selected: "محدد",
    templateNote: "الإرسال الجماعي لازم بقالب واتساب معتمد من ميتا (النص الحر بيوصل خلال ٢٤ ساعة فقط).",
    nameLabel: "اسم الحملة", templateLabel: "اسم القالب", langLabel: "اللغة",
    paramsLabel: "قيم القالب (مفصولة بفواصل، تملأ {{1}}، {{2}}…)",
    send: "إرسال الحملة", sending: "جاري الإرسال…",
    needTemplate: "أدخل اسم القالب المعتمد.", needRecipients: "اختر مستلمًا واحدًا على الأقل.",
    result: "أُرسل {sent}، فشل {failed}.", noName: "بدون اسم",
  },
};

export function CampaignPanel({ patients }: { patients: PatientView[] }) {
  const { locale } = useLanguage();
  const L = STR[locale === "ar" ? "ar" : "en"];

  const withPhone = patients.filter((p) => p.patientPhone);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [lang, setLang] = useState("ar");
  const [params, setParams] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const allSelected = withPhone.length > 0 && selected.size === withPhone.length;
  function toggle(phone: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(withPhone.map((p) => p.patientPhone)));
  }

  function send() {
    if (!templateName.trim()) return setError(L.needTemplate);
    if (selected.size === 0) return setError(L.needRecipients);
    setError(null);
    setResult(null);
    const bodyParams = params.split(",").map((s) => s.trim()).filter(Boolean);
    startTransition(async () => {
      const res = await sendCampaignAction({
        name,
        templateName,
        templateLang: lang,
        bodyParams,
        phones: Array.from(selected),
      });
      if (res.ok) setResult({ sent: res.sent, failed: res.failed });
      else setError(res.error ?? "error");
    });
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-jade-500/50 focus:ring-2 focus:ring-jade-500/20";
  const label = "mb-1.5 block text-xs font-semibold text-foreground";

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold text-foreground">{L.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{L.subtitle}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Compose */}
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <label className={label}>{L.nameLabel}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={label}>{L.templateLabel}</label>
              <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} dir="ltr" className={cn(field, "font-mono")} />
            </div>
            <div>
              <label className={label}>{L.langLabel}</label>
              <input value={lang} onChange={(e) => setLang(e.target.value)} dir="ltr" className={cn(field, "font-mono")} />
            </div>
          </div>
          <div>
            <label className={label}>{L.paramsLabel}</label>
            <input value={params} onChange={(e) => setParams(e.target.value)} className={field} />
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Icon name="CircleAlert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {L.templateNote}
          </p>
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          {result && (
            <p className="text-xs font-semibold text-jade-700">
              {L.result.replace("{sent}", String(result.sent)).replace("{failed}", String(result.failed))}
            </p>
          )}
          <button
            type="button"
            onClick={send}
            disabled={pending}
            className="cursor-pointer rounded-xl bg-jade-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jade-600 disabled:opacity-50"
          >
            {pending ? L.sending : `${L.send} (${selected.size})`}
          </button>
        </div>

        {/* Recipients */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Icon name="Users" className="h-4 w-4 text-jade-600" />
              {L.recipients}
              <span className="text-xs font-normal text-muted-foreground">
                {selected.size} {L.selected}
              </span>
            </span>
            {withPhone.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="cursor-pointer text-xs font-semibold text-jade-600 hover:text-jade-700"
              >
                {L.selectAll}
              </button>
            )}
          </div>
          {withPhone.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">{L.empty}</p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
              {withPhone.map((p) => (
                <li key={p.patientPhone}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/40">
                    <input
                      type="checkbox"
                      checked={selected.has(p.patientPhone)}
                      onChange={() => toggle(p.patientPhone)}
                      className="h-4 w-4 cursor-pointer rounded accent-jade-500"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">{p.name || L.noName}</span>
                      <span className="block truncate font-mono text-xs text-muted-foreground" dir="ltr">
                        {p.patientPhone}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
