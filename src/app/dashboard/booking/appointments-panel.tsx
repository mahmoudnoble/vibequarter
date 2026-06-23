"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/language-provider";
import { updateApptStatusAction } from "./booking-actions";
import type { AppointmentFull } from "@/lib/booking/types";

type Status = AppointmentFull["status"];
const ALL_STATUSES: Status[] = ["booked", "cancelled", "completed", "no_show"];

export function AppointmentsPanel({
  initialAppointments,
}: {
  initialAppointments: AppointmentFull[];
}) {
  const { t, locale } = useLanguage();
  const at = t.dashboard.booking.apptTab;
  const tb = t.dashboard.booking;

  const [appointments, setAppointments] = useState<AppointmentFull[]>(initialAppointments);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [actioning, setActioning] = useState<string | null>(null);

  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const fmt = (iso: string) => dateFmt.format(new Date(iso));

  const filtered =
    filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  async function changeStatus(id: string, status: Status) {
    setActioning(id);
    const res = await updateApptStatusAction(id, status);
    if (res.ok) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    }
    setActioning(null);
  }

  const filterLabel: Record<string, string> = {
    all: at.filterAll,
    booked: at.filterBooked,
    cancelled: at.filterCancelled,
    completed: at.filterCompleted,
    no_show: at.filterNoShow,
  };

  const statusBadge: Record<Status, string> = {
    booked: "bg-jade-500/12 text-jade-700",
    cancelled: "bg-red-500/12 text-red-600",
    completed: "bg-blue-500/12 text-blue-700",
    no_show: "bg-amber-500/12 text-amber-700",
  };

  const statusLabel: Record<Status, string> = {
    booked: at.statusBooked,
    cancelled: at.statusCancelled,
    completed: at.statusCompleted,
    no_show: at.statusNoShow,
  };

  const sourceLabel: Record<string, string> = {
    simulator: at.sourceSimulator,
    whatsapp: at.sourceWhatsapp,
    manual: at.sourceManual,
  };

  const svcName = (a: AppointmentFull) =>
    locale === "ar" ? a.serviceNameAr : a.serviceNameEn;

  return (
    <div className="py-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Icon name="CalendarDays" className="h-4 w-4 text-jade-600" />
          {at.heading}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {filtered.length}
          </span>
        </h2>
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["all", ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              filter === s
                ? "bg-jade-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {filterLabel[s]}
            <span className="ms-1.5 opacity-70">
              {s === "all"
                ? appointments.length
                : appointments.filter((a) => a.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="CalendarX2" className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{at.empty}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{a.patientName}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        statusBadge[a.status],
                      )}
                    >
                      {statusLabel[a.status]}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {sourceLabel[a.source] ?? a.source}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fmt(a.startIso)}
                    {svcName(a) && <span className="ms-2 text-foreground/70">{svcName(a)}</span>}
                    {a.patientPhone && (
                      <span className="ms-2 font-mono" dir="ltr">{a.patientPhone}</span>
                    )}
                  </p>
                </div>

                {a.status === "booked" && (
                  <div className="flex shrink-0 gap-1">
                    <ActionBtn
                      label={at.actionComplete}
                      disabled={actioning === a.id}
                      onClick={() => changeStatus(a.id, "completed")}
                      variant="success"
                    />
                    <ActionBtn
                      label={at.actionNoShow}
                      disabled={actioning === a.id}
                      onClick={() => changeStatus(a.id, "no_show")}
                      variant="warning"
                    />
                    <ActionBtn
                      label={at.actionCancel}
                      disabled={actioning === a.id}
                      onClick={() => changeStatus(a.id, "cancelled")}
                      variant="danger"
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  disabled,
  onClick,
  variant,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  variant: "success" | "warning" | "danger";
}) {
  const cls = {
    success: "text-jade-600 hover:bg-jade-500/10",
    warning: "text-amber-600 hover:bg-amber-500/10",
    danger: "text-red-500 hover:bg-red-500/10",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        cls,
      )}
    >
      {label}
    </button>
  );
}
