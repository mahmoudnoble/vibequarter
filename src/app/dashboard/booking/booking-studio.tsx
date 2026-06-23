"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/language-provider";
import { SetupPanel } from "./setup-panel";
import { AppointmentsPanel } from "./appointments-panel";
import { PatientsPanel } from "./patients-panel";
import { SimulatorPanel } from "./simulator-panel";
import type {
  AppointmentFull,
  PatientView,
  ServiceView,
  WorkingHourInput,
} from "@/lib/booking/types";

type Tab = "setup" | "appointments" | "patients" | "simulator";

const TAB_ICONS: Record<Tab, string> = {
  setup: "Settings2",
  appointments: "CalendarDays",
  patients: "Users",
  simulator: "Bot",
};

export function BookingStudio({
  clinicId,
  clinicName,
  waPnId,
  timezone,
  services,
  workingHours,
  initialAppointments,
  initialPatients,
}: {
  clinicId: string;
  clinicName: string;
  waPnId: string | null;
  timezone: string;
  services: ServiceView[];
  workingHours: WorkingHourInput[];
  initialAppointments: AppointmentFull[];
  initialPatients: PatientView[];
}) {
  const { t } = useLanguage();
  const tb = t.dashboard.booking;
  const tabs = tb.bookingTabs;

  const [activeTab, setActiveTab] = useState<Tab>("setup");
  const [appointments, setAppointments] = useState<AppointmentFull[]>(initialAppointments);

  const TAB_LABELS: Record<Tab, string> = {
    setup: tabs.setup,
    appointments: tabs.appointments,
    patients: tabs.patients,
    simulator: tabs.simulator,
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">{tb.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{tb.subtitle}</p>
      </header>

      {/* Tab navigation */}
      <nav
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1"
        role="tablist"
      >
        {(["setup", "appointments", "patients", "simulator"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon name={TAB_ICONS[tab]} className="h-4 w-4 shrink-0" />
            {TAB_LABELS[tab]}
            {tab === "appointments" && appointments.length > 0 && (
              <span className="rounded-full bg-jade-500/15 px-1.5 py-0.5 text-xs font-bold text-jade-700">
                {appointments.filter((a) => a.status === "booked").length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab panels */}
      {activeTab === "setup" && (
        <SetupPanel
          clinicId={clinicId}
          clinicName={clinicName}
          waPnId={waPnId}
          services={services}
          workingHours={workingHours}
        />
      )}

      {activeTab === "appointments" && (
        <AppointmentsPanel initialAppointments={appointments} />
      )}

      {activeTab === "patients" && <PatientsPanel patients={initialPatients} />}

      {activeTab === "simulator" && (
        <SimulatorPanel
          clinicName={clinicName}
          timezone={timezone}
          services={services}
          allAppointments={appointments}
          onAppointmentsChange={setAppointments}
        />
      )}
    </div>
  );
}
