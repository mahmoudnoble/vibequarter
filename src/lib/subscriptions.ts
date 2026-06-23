import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeModel, DEFAULT_MODEL, type ClaudeModel } from "@/lib/plans";

export type PlanCapabilities = {
  /** Claude model tier the builder agent uses. */
  model: ClaudeModel;
  /** Whether this tenant's plan may generate images with GPT Image. */
  imageGen: boolean;
};

const FREE_CAPS: PlanCapabilities = { model: DEFAULT_MODEL, imageGen: false };

/**
 * Resolve the capabilities for a tenant from its active subscription's plan.
 * Server-side only — gates model tier + image generation so the client can
 * never escalate them. Falls back to the free defaults when the tenant has no
 * active subscription (or Supabase env is missing).
 *
 * @param owner the hybrid tenant id (active org id, else user sub).
 */
export async function getPlanCapabilitiesForOwner(
  owner: string | null | undefined,
): Promise<PlanCapabilities> {
  if (!owner) return FREE_CAPS;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return FREE_CAPS;

  const { data } = await supabase
    .from("subscriptions")
    .select("status, plans ( model, image_gen )")
    .eq("owner_id", owner)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  // PostgREST returns the embedded relation as an object (or array); handle both.
  const rel = (data as { plans?: PlanRel | PlanRel[] } | null)?.plans;
  const plan = Array.isArray(rel) ? rel[0] : rel;
  if (!plan) return FREE_CAPS;
  return { model: normalizeModel(plan.model), imageGen: plan.image_gen === true };
}

type PlanRel = { model?: string; image_gen?: boolean };

/** Convenience: just the model tier (used by the AI agent routes). */
export async function getActiveModelForOwner(owner: string | null | undefined): Promise<ClaudeModel> {
  return (await getPlanCapabilitiesForOwner(owner)).model;
}
