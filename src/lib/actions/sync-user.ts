"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function syncUser() {
  const { userId } = await auth();
  if (!userId) return;

  const user = await currentUser();
  if (!user) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  const supabase = createClient(url, serviceKey);

  await supabase.from("users").upsert(
    {
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? null,
      full_name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      image_url: user.imageUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clerk_id" },
  );
}

/**
 * Pull-based reconciliation: delete any public.users rows whose Clerk account
 * no longer exists. Runs on dashboard load so deletions in Clerk propagate to
 * Supabase WITHOUT a webhook (localhost can't receive one). In production a
 * Clerk `user.deleted` webhook does this instantly; see the launch checklist.
 */
export async function reconcileUsers() {
  // Defense in depth: only run inside an authenticated request.
  const { userId } = await auth();
  if (!userId) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  let liveIds: Set<string>;
  try {
    const client = await clerkClient();
    const res = await client.users.getUserList({ limit: 500 });
    // Never prune on an empty or incomplete Clerk list — a misconfigured key or
    // a transient empty 200 would otherwise wipe the entire mirror.
    if (res.totalCount === 0 || res.data.length === 0) return;
    if (res.totalCount > res.data.length) return;
    liveIds = new Set(res.data.map((u) => u.id));
  } catch {
    return; // Clerk API hiccup — never delete on incomplete/failed data.
  }

  const supabase = createClient(url, serviceKey);
  const { data: rows } = await supabase.from("users").select("clerk_id");
  if (!rows?.length) return;

  const orphans = rows.map((r) => r.clerk_id).filter((id) => !liveIds.has(id));
  // Refuse to empty the whole table — that signals a bad Clerk list, not real deletions.
  if (orphans.length === rows.length) {
    console.warn(`[reconcileUsers] skipped deleting all ${rows.length} rows — Clerk list may be incomplete.`);
    return;
  }
  if (orphans.length) await supabase.from("users").delete().in("clerk_id", orphans);
}
