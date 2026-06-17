"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPlanBySlug } from "@/lib/plans";

/** Look up the chosen plan's account type + seat count (auth-gated). */
export async function resolvePlan(slug: string): Promise<{ type: "personal" | "organization"; maxMembers: number } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const plan = await getPlanBySlug(slug);
  if (!plan) return null;
  return { type: plan.type, maxMembers: plan.max_members };
}

/** Apply the plan's seat limit to the user's active organization (best effort). */
export async function finalizeOrgPlan(slug: string): Promise<void> {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return;
  const plan = await getPlanBySlug(slug);
  if (!plan || plan.type !== "organization") return;
  try {
    const client = await clerkClient();
    await client.organizations.updateOrganization(orgId, { maxAllowedMemberships: plan.max_members });
  } catch {
    /* best effort — seat limit is non-critical for the flow */
  }
}
