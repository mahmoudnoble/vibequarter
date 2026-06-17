"use client";

import { useEffect, useState } from "react";
import { useAuth, CreateOrganization } from "@clerk/nextjs";
import { resolvePlan, finalizeOrgPlan } from "./onboarding-actions";

/**
 * Plan-driven account setup. The pricing CTA stashed the chosen plan slug in
 * localStorage ("vq-plan"). If that plan is an ORGANIZATION (team) plan and the
 * user has no active org yet, prompt them to create their company workspace.
 * Personal plans (and users who already have an org) just clear the flag.
 */
export function PlanOnboarding() {
  const { isLoaded, orgId } = useAuth();
  const [needsOrg, setNeedsOrg] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    let slug: string | null = null;
    try {
      slug = localStorage.getItem("vq-plan");
    } catch {
      /* ignore */
    }
    if (!slug) return;

    let cancelled = false;
    const clear = () => {
      try {
        localStorage.removeItem("vq-plan");
      } catch {
        /* ignore */
      }
    };

    (async () => {
      const plan = await resolvePlan(slug);
      if (cancelled) return;
      if (!plan || plan.type === "personal") {
        clear();
        return;
      }
      // Organization (team) plan:
      if (orgId) {
        await finalizeOrgPlan(slug); // set the org's seat limit from the plan
        clear();
      } else {
        setNeedsOrg(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, orgId]);

  if (!needsOrg) return null;

  return (
    <section className="mb-6 rounded-xl border border-jade-500/30 bg-jade-500/[0.06] p-5">
      <h2 className="font-display text-lg font-bold text-foreground">Create your team workspace</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        You chose a team plan — set up your organization to invite members and share sites.
      </p>
      <CreateOrganization
        afterCreateOrganizationUrl="/dashboard"
        appearance={{ variables: { colorPrimary: "#10B981", borderRadius: "12px" } }}
      />
    </section>
  );
}
