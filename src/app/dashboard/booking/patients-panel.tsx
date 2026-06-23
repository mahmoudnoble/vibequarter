"use client";

import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";
import type { PatientView } from "@/lib/booking/types";

export function PatientsPanel({ patients }: { patients: PatientView[] }) {
  const { t, locale } = useLanguage();
  const pt = t.dashboard.booking.patientsTab;

  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const fmt = (iso: string) => dateFmt.format(new Date(iso));

  return (
    <div className="py-2">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Icon name="Users" className="h-4 w-4 text-jade-600" />
          {pt.heading}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {patients.length}
          </span>
        </h2>
      </div>

      {patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="UserX" className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="max-w-xs text-sm text-muted-foreground">{pt.empty}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {patients.map((p) => (
            <li
              key={p.patientPhone}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-jade-500/12 text-jade-600">
                  <Icon name="User" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-foreground" dir="ltr">
                    {p.patientPhone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pt.lastContact}: {fmt(p.lastMessageAt)}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-jade-500/12 px-2.5 py-1 text-xs font-semibold text-jade-700">
                {p.turnCount} {pt.messages}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
