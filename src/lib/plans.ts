import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

export type Locale = "en" | "ar";
export type Bilingual = { en: string; ar: string };

/** The model tiers a plan can map to (abstract ids). The app runs on OpenAI. */
export const APP_MODELS = ["gpt-4o-mini", "gpt-4o"] as const;
export type AppModel = (typeof APP_MODELS)[number];
export const DEFAULT_MODEL: AppModel = "gpt-4o-mini";

/** Coerce any stored/legacy model string (incl. old Claude ids) to a valid tier. */
export function normalizeModel(model: string | null | undefined): AppModel {
  if (!model) return DEFAULT_MODEL;
  // Top tier — and legacy Claude Opus/Sonnet rows — map to gpt-4o.
  if (model === "gpt-4o" || model.startsWith("claude-opus") || model.startsWith("claude-sonnet")) return "gpt-4o";
  return DEFAULT_MODEL;
}

export type Plan = {
  id: string;
  slug: string;
  type: "personal" | "organization";
  max_members: number;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string;
  model: string;
  image_gen: boolean;
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
 *  plans; no Clerk token needed. Returns null if env vars are missing.
 *  Module-level singleton — one instance per server process, no reconnect overhead. */
let _publicClient: ReturnType<typeof createClient> | null = null;
function publicClient() {
  if (_publicClient) return _publicClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _publicClient = createClient(url, key);
  return _publicClient;
}

// Postgres `numeric` comes back as a string over PostgREST — coerce to number.
function normalize(row: Record<string, unknown>): Plan {
  return {
    ...(row as Plan),
    price_monthly: row.price_monthly == null ? null : Number(row.price_monthly),
    price_yearly: row.price_yearly == null ? null : Number(row.price_yearly),
  };
}

const _fetchActivePlans = async (): Promise<Plan[]> => {
  const supabase = publicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data.map(normalize);
};

/** Cached 1 hour — plans rarely change; invalidate via revalidateTag("plans") after admin edits. */
export const getActivePlans = unstable_cache(_fetchActivePlans, ["plans-active"], {
  revalidate: 3600,
  tags: ["plans"],
});

export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const supabase = publicClient();
  if (!supabase) return null;
  const { data } = await supabase.from("plans").select("*").eq("slug", slug).maybeSingle();
  return data ? normalize(data) : null;
}
