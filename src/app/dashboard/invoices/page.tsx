import { getOwner } from "@/lib/tenant";
import { ensureClinicContext, getClinicTaxSettings, getAllAppointmentsFull } from "@/lib/booking/clinic";
import { getInvoices } from "@/lib/booking/invoices";
import { InvoicesPanel } from "../booking/invoices-panel";

export const metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const owner = await getOwner();
  const ctx = owner ? await ensureClinicContext(owner) : null;

  const [invoices, taxSettings, allAppts] = ctx && owner
    ? await Promise.all([
        getInvoices(ctx.clinic.id, owner),
        getClinicTaxSettings(ctx.clinic.id, owner),
        getAllAppointmentsFull(ctx.clinic.id, owner),
      ])
    : [[], null, []];

  // Completed appointments that don't already have an invoice — the only ones
  // an invoice may be issued for.
  const invoicedApptIds = new Set(invoices.map((i) => i.appointmentId).filter(Boolean));
  const invoiceable = allAppts.filter((a) => a.status === "completed" && !invoicedApptIds.has(a.id));

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
      <InvoicesPanel initialInvoices={invoices} invoiceable={invoiceable} taxSettings={taxSettings} />
    </div>
  );
}
