import { createClient } from "@supabase/supabase-js";

export type Locale = "en" | "ar";
export type Bilingual = { en: string; ar: string };

export type Plan = {
  id: string;
  slug: string;
  type: "personal" | "organization";
  max_members: number;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string;
  name: Bilingual;
  blurb: Bilingual;
  features: { en: string[]; ar: string[] };
  cta: Bilingual;
  price_label: Bilingual | null;
  cta_action: "signup" | "contact";
  featured: boolean;
  is_active: boolean;
  sort_order: number;
};

/** Plain anon client for PUBLIC reads (pricing page). RLS only exposes active
 *  plans; no Clerk token needed. Returns null if env vars are missing. */
function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Postgres `numeric` comes back as a string over PostgREST — coerce to number.
function normalize(row: Record<string, unknown>): Plan {
  return {
    ...(row as Plan),
    price_monthly: row.price_monthly == null ? null : Number(row.price_monthly),
    price_yearly: row.price_yearly == null ? null : Number(row.price_yearly),
  };
}

export async function getActivePlans(): Promise<Plan[]> {
  const supabase = publicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data.map(normalize);
}

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const supabase = publicClient();
  if (!supabase) return null;
  const { data } = await supabase.from("plans").select("*").eq("slug", slug).maybeSingle();
  return data ? normalize(data) : null;
}
