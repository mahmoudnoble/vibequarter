"use client";

import { useAuth } from "@clerk/nextjs";
import { createBrowserClient } from "@supabase/ssr";

export function useSupabaseClient() {
  const { getToken } = useAuth();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createBrowserClient(url, key, {
    global: {
      fetch: async (fetchUrl: RequestInfo | URL, options: RequestInit = {}) => {
        const clerkToken = await getToken({ template: "supabase" }).catch(() => null);
        const headers = new Headers(options.headers);
        if (clerkToken) headers.set("Authorization", `Bearer ${clerkToken}`);
        return fetch(fetchUrl, { ...options, headers });
      },
    },
  });
}
