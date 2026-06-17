"use client";

import { useAuth } from "@clerk/nextjs";
import { createBrowserClient } from "@supabase/ssr";

export function useSupabaseClient() {
  const { getToken } = useAuth();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  // Native Clerk Third-Party Auth: Supabase trusts Clerk's session token
  // directly, so hand supabase-js a per-request accessToken — no JWT template,
  // no manual Authorization header. Requires the Clerk↔Supabase integration
  // enabled on both dashboards.
  return createBrowserClient(url, key, {
    accessToken: async () => (await getToken()) ?? null,
  });
}
