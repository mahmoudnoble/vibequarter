/**
 * DEV-ONLY background sync daemon: keeps Supabase `public.users` mirrored to
 * Clerk by polling every few seconds.
 *
 * Why this exists: on localhost we can't receive Clerk webhooks, and the app
 * only syncs on dashboard load — so a user deleted in Clerk lingers in Supabase
 * until someone opens the app. This loop syncs continuously (upsert live users
 * + delete orphans) with NO app interaction and NO public tunnel.
 *
 * Production does NOT use this — it uses a Clerk `user.deleted` webhook
 * (instant, event-driven). See the production launch checklist.
 *
 * Run:  node scripts/sync-clerk-supabase.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Plain node doesn't auto-load .env.local (Next does) — parse it ourselves.
const env = {};
try {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/\r$/, "").replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("[sync] could not read .env.local");
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const CLERK_KEY = env.CLERK_SECRET_KEY;
const INTERVAL_MS = 10_000;

if (!SUPABASE_URL || !SERVICE_KEY || !CLERK_KEY) {
  console.error("[sync] missing env (SUPABASE url / service role / CLERK secret). Exiting.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function clerkList() {
  const [usersRes, countRes] = await Promise.all([
    fetch("https://api.clerk.com/v1/users?limit=500", { headers: { Authorization: `Bearer ${CLERK_KEY}` } }),
    fetch("https://api.clerk.com/v1/users/count", { headers: { Authorization: `Bearer ${CLERK_KEY}` } }),
  ]);
  if (!usersRes.ok || !countRes.ok) throw new Error(`clerk ${usersRes.status}/${countRes.status}`);
  const users = await usersRes.json();
  const { total_count } = await countRes.json();
  return { users, total: total_count };
}

async function reconcile() {
  let users, total;
  try {
    ({ users, total } = await clerkList());
  } catch (e) {
    console.error("[sync] Clerk fetch failed — skipping this round:", e.message);
    return;
  }

  if (!Array.isArray(users)) {
    console.error("[sync] unexpected Clerk response (not an array) — skipping.");
    return;
  }

  const live = new Map();
  for (const u of users) {
    const primary = u.email_addresses?.find((e) => e.id === u.primary_email_address_id) ?? u.email_addresses?.[0];
    live.set(u.id, {
      clerk_id: u.id,
      email: primary?.email_address ?? null,
      full_name: [u.first_name, u.last_name].filter(Boolean).join(" ") || null,
      image_url: u.image_url ?? null,
      updated_at: new Date().toISOString(),
    });
  }

  // Upsert every live Clerk user.
  if (live.size) {
    const { error } = await supabase.from("users").upsert([...live.values()], { onConflict: "clerk_id" });
    if (error) console.error("[sync] upsert error:", error.message);
  }

  // Delete orphans — but ONLY when we hold the complete, non-empty Clerk list,
  // so we never wipe the mirror on pagination, an API hiccup, or an empty 200.
  if (total === 0 || users.length === 0) return;
  if (total > users.length) {
    console.warn(`[sync] Clerk has ${total} users but only fetched ${users.length}; skipping delete to stay safe.`);
    return;
  }
  const { data: rows, error: selErr } = await supabase.from("users").select("clerk_id");
  if (selErr) return console.error("[sync] select error:", selErr.message);
  if (!rows?.length) return;
  const orphans = (rows ?? []).map((r) => r.clerk_id).filter((id) => !live.has(id));
  if (orphans.length === rows.length) {
    console.warn(`[sync] refusing to delete all ${rows.length} rows — Clerk list may be wrong.`);
    return;
  }
  if (orphans.length) {
    const { error } = await supabase.from("users").delete().in("clerk_id", orphans);
    if (error) console.error("[sync] delete error:", error.message);
    else console.log(`[sync] removed ${orphans.length} orphan(s) deleted from Clerk:`, orphans.join(", "));
  }
}

console.log(`[sync] mirroring Clerk -> Supabase public.users every ${INTERVAL_MS / 1000}s`);
await reconcile();
setInterval(reconcile, INTERVAL_MS);
