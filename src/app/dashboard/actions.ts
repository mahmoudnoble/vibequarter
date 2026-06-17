"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TestResult = { ok: boolean; message: string; detail?: string };

/**
 * End-to-end check: insert a row owned by the current tenant, then read it back.
 * Hybrid tenancy — the owner is the active ORG (team plan) or the USER (sub,
 * individual plan), which is exactly what RLS's current_tenant() compares the
 * WITH CHECK against. Works whether or not the user is in an organization.
 */
export async function runWriteTest(): Promise<TestResult> {
  const { userId, sessionClaims } = await auth();
  const claims = (sessionClaims ?? {}) as Record<string, unknown>;
  const orgId = typeof claims.org_id === "string" && claims.org_id.length > 0 ? claims.org_id : null;
  const owner = orgId ?? userId; // active org if any, else the individual user
  if (!owner) return { ok: false, message: "You're not signed in." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase env vars are not set." };

  const slug = `rls-test-${Date.now()}`;
  const { data, error } = await supabase
    .from("sites")
    .insert({ owner_id: owner, name: "RLS test site", slug })
    .select()
    .single();

  if (error) {
    return {
      ok: false,
      message: "Insert was blocked or failed — the token/RLS bridge is not working yet.",
      detail: error.message,
    };
  }

  return {
    ok: true,
    message: `Inserted and read back a row owned by ${orgId ? "your organization" : "you"} — the Clerk → Supabase → RLS chain works.`,
    detail: `id=${data.id} · slug=${data.slug} · owner_id=${data.owner_id}`,
  };
}
