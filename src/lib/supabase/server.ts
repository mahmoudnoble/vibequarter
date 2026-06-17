import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

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
