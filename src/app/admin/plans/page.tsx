import { notFound } from "next/navigation";
import { isSuperAdmin, listAllPlans } from "@/lib/admin";
import { PlanForm } from "./plan-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plans · Admin" };

export default async function PlansAdminPage() {
  if (!(await isSuperAdmin())) notFound();
  const plans = await listAllPlans();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12">
      <h1 className="font-display text-2xl font-bold text-foreground">Plans</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Super-admin only. <strong>type</strong> drives the account model (personal vs organization) and{" "}
        <strong>max members</strong> sets the org seat limit. Changes appear on the pricing page after refresh.
      </p>

      <section className="mt-8 space-y-6">
        {plans.map((p) => (
          <PlanForm key={p.id} plan={p} />
        ))}

        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">＋ New plan</h2>
          <PlanForm />
        </div>
      </section>
    </main>
  );
}
