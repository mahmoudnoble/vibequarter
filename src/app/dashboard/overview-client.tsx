"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "@/components/i18n/language-provider";

export type SuperTotals = { clinics: number; bookings: number; revenue: number; patients: number; invoices: number };
export type ClinicStats = { clinicName: string; upcoming: number; completed: number; patients: number; invoices: number };

const STR = {
  en: {
    saTitle: "Platform overview", saSubtitle: "Usage across all your clinics.",
    clinics: "Clinics", bookings: "Bookings", revenue: "Revenue", patients: "Patients", invoices: "Invoices",
    manageClinics: "Manage clinics", upcoming: "Upcoming", completed: "Completed",
    recTitle: "Overview", recSubtitle: "Your clinic at a glance.",
    openBooking: "Booking agent", openInvoices: "Invoices", noClinic: "No clinic yet.",
  },
  ar: {
    saTitle: "نظرة عامة على المنصة", saSubtitle: "الاستهلاك عبر كل عياداتك.",
    clinics: "العيادات", bookings: "الحجوزات", revenue: "الإيراد", patients: "المرضى", invoices: "الفواتير",
    manageClinics: "إدارة العيادات", upcoming: "قادمة", completed: "مكتملة",
    recTitle: "نظرة عامة", recSubtitle: "عيادتك في لمحة.",
    openBooking: "وكيل الحجز", openInvoices: "الفواتير", noClinic: "لا توجد عيادة بعد.",
  },
};

function Stat({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-jade-500/12 text-jade-600">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function OverviewClient({
  role,
  superTotals,
  clinicStats,
}: {
  role: "super_admin" | "receptionist";
  superTotals?: SuperTotals;
  clinicStats?: ClinicStats | null;
}) {
  const { locale } = useLanguage();
  const L = STR[locale === "ar" ? "ar" : "en"];

  if (role === "super_admin" && superTotals) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{L.saTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{L.saSubtitle}</p>
          </div>
          <Link
            href="/dashboard/admin"
            className="shrink-0 cursor-pointer rounded-xl bg-jade-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jade-600"
          >
            {L.manageClinics}
          </Link>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label={L.clinics} value={superTotals.clinics} icon="Building2" />
          <Stat label={L.bookings} value={superTotals.bookings} icon="CalendarDays" />
          <Stat label={L.revenue} value={superTotals.revenue.toFixed(0)} icon="ReceiptText" />
          <Stat label={L.patients} value={superTotals.patients} icon="Users" />
          <Stat label={L.invoices} value={superTotals.invoices} icon="ReceiptText" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {clinicStats?.clinicName || L.recTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{L.recSubtitle}</p>
      </header>
      {clinicStats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={L.upcoming} value={clinicStats.upcoming} icon="CalendarDays" />
            <Stat label={L.completed} value={clinicStats.completed} icon="CheckCircle2" />
            <Stat label={L.patients} value={clinicStats.patients} icon="Users" />
            <Stat label={L.invoices} value={clinicStats.invoices} icon="ReceiptText" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/booking"
              className="cursor-pointer rounded-xl bg-jade-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jade-600"
            >
              {L.openBooking}
            </Link>
            <Link
              href="/dashboard/invoices"
              className="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {L.openInvoices}
            </Link>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{L.noClinic}</p>
      )}
    </div>
  );
}
