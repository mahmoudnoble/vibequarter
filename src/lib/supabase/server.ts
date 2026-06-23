import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — BYPASSES RLS. Server-only, never expose to the client.
 * Use for trusted writes that stamp owner_id themselves (storage uploads,
 * public-site reads, billing/onboarding). Returns null if env is missing.
 */
export function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const { getToken } = await auth();

  // Native Clerk Third-Party Auth: a plain supabase-js client that pulls the
  // Clerk session token per request via accessToken (re-evaluated each call, so
  // it never goes stale). We deliberately do NOT use @supabase/ssr here — Clerk
  // owns the session, and ssr's cookie-based Supabase Auth sync is incompatible
  // with the accessToken option (it throws on onAuthStateChange).
  return createClient(url, key, {
    accessToken: async () => (await getToken()) ?? null,
  });
}
