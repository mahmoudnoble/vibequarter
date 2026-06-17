"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TestResult = { ok: boolean; message: string; detail?: string };

/**
 * The conclusive end-to-end check: insert a tenant-scoped row, then read it
 * back. This only succeeds if (a) Supabase accepts the Clerk token, (b) the
 * token carries org_id, and (c) the RLS WITH CHECK (org_id = public.org_id())
 * passes — i.e. the whole bridge works.
 */
export async function runWriteTest(): Promise<TestResult> {
  const { orgId } = await auth();
  if (!orgId) {
    return {
      ok: false,
      message:
        "No active organization. RLS scopes rows by org, so pick/create one in the switcher above, then retry.",
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Supabase env vars are not set." };

  const slug = `rls-test-${Date.now()}`;
  const { data, error } = await supabase
    .from("sites")
    .insert({ org_id: orgId, name: "RLS test site", slug })
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
    message: "Inserted and read back a tenant-scoped row — the full Clerk → Supabase → RLS chain works.",
    detail: `id=${data.id} · slug=${data.slug} · org_id=${data.org_id}`,
  };
}
