"use client";

import { useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

export function useSupabaseClient() {
  const { getToken } = useAuth();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  // Native Clerk Third-Party Auth: plain supabase-js client (not @supabase/ssr,
  // which manages its own cookie session and conflicts with accessToken). The
  // Clerk session token is attached per request via accessToken.
  return createClient(url, key, {
    accessToken: async () => (await getToken()) ?? null,
  });
}
