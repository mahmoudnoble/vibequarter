import { getOwner } from "@/lib/tenant";
import { ensureClinicContext } from "@/lib/booking/clinic";
import { listQuestions } from "@/lib/booking/questions";
import { QuestionsPanel } from "./questions-panel";

export const metadata = { title: "Questions" };
export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const owner = await getOwner();
  const ctx = owner ? await ensureClinicContext(owner) : null;
  const questions = ctx && owner ? await listQuestions(ctx.clinic.id, owner) : [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8">
      <QuestionsPanel initial={questions} />
    </div>
  );
}
