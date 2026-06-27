import { getOwner } from "@/lib/tenant";
import { ensureClinicContext, getPatients } from "@/lib/booking/clinic";
import { CampaignPanel } from "./campaign-panel";

export const metadata = { title: "Campaign" };
export const dynamic = "force-dynamic";

export default async function CampaignPage() {
  const owner = await getOwner();
  const ctx = owner ? await ensureClinicContext(owner) : null;
  const patients = ctx && owner ? await getPatients(ctx.clinic.id, owner) : [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8">
      <CampaignPanel patients={patients} />
    </div>
  );
}
