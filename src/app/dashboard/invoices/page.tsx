import { getOwner } from "@/lib/tenant";
import { ensureClinicContext, getClinicTaxSettings } from "@/lib/booking/clinic";
import { getInvoices } from "@/lib/booking/invoices";
import { InvoicesPanel } from "../booking/invoices-panel";

export const metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const owner = await getOwner();
  const ctx = owner ? await ensureClinicContext(owner) : null;

  const [invoices, taxSettings] = ctx && owner
    ? await Promise.all([getInvoices(ctx.clinic.id, owner), getClinicTaxSettings(ctx.clinic.id, owner)])
    : [[], null];

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
      <InvoicesPanel initialInvoices={invoices} taxSettings={taxSettings} />
    </div>
  );
}
