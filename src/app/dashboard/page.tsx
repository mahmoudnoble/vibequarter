import { currentRole } from "@/lib/roles";
import { getOwner } from "@/lib/tenant";
import { ensureClinicContext, getAllAppointmentsFull, getPatients } from "@/lib/booking/clinic";
import { getInvoices } from "@/lib/booking/invoices";
import { listClinicUsage } from "@/lib/admin/usage";
import { OverviewClient } from "./overview-client";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const role = await currentRole();

  if (role === "super_admin") {
    const clinics = await listClinicUsage();
    const superTotals = clinics.reduce(
      (a, c) => ({
        clinics: a.clinics + 1,
        bookings: a.bookings + c.bookingsTotal,
        revenue: a.revenue + c.revenue,
        patients: a.patients + c.patientsCount,
        invoices: a.invoices + c.invoicesCount,
      }),
      { clinics: 0, bookings: 0, revenue: 0, patients: 0, invoices: 0 },
    );
    return <OverviewClient role="super_admin" superTotals={superTotals} />;
  }

  // Receptionist (or any single-clinic user): their clinic at a glance.
  const owner = await getOwner();
  const ctx = owner ? await ensureClinicContext(owner) : null;
  if (!ctx || !owner) return <OverviewClient role="receptionist" clinicStats={null} />;

  const [appts, patients, invoices] = await Promise.all([
    getAllAppointmentsFull(ctx.clinic.id, owner),
    getPatients(ctx.clinic.id, owner),
    getInvoices(ctx.clinic.id, owner),
  ]);
  const now = Date.now();
  const stats = {
    clinicName: ctx.clinic.name || "",
    upcoming: appts.filter((a) => a.status === "booked" && new Date(a.startIso).getTime() >= now).length,
    completed: appts.filter((a) => a.status === "completed").length,
    patients: patients.length,
    invoices: invoices.length,
  };
  return <OverviewClient role="receptionist" clinicStats={stats} />;
}
