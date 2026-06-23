"use server";

import { createClient } from "@supabase/supabase-js";
import { isSuperAdmin } from "@/lib/admin";
import { revalidatePath, revalidateTag } from "next/cache";
import type { Bilingual } from "@/lib/plans";

export type PlanInput = {
  id?: string;
  slug: string;
  type: "personal" | "organization";
  max_members: number;
  model: string;
  image_gen: boolean;
  price_monthly: number | null;
  price_yearly: number | null;
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

type Result = { ok: boolean; error?: string };

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function savePlan(input: PlanInput): Promise<Result> {
  if (!(await isSuperAdmin())) return { ok: false, error: "Forbidden" };
  if (!input.slug?.trim()) return { ok: false, error: "Slug is required." };
  const supabase = adminClient();
  if (!supabase) return { ok: false, error: "Supabase not configured." };

  const { error } = await supabase
    .from("plans")
    .upsert({ ...input, updated_at: new Date().toISOString() }, { onConflict: "slug" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/plans");
  revalidatePath("/");
  revalidateTag("plans");
  return { ok: true };
}

export async function deletePlan(id: string): Promise<Result> {
  if (!(await isSuperAdmin())) return { ok: false, error: "Forbidden" };
  const supabase = adminClient();
  if (!supabase) return { ok: false, error: "Supabase not configured." };

  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/plans");
  revalidatePath("/");
  revalidateTag("plans");
  return { ok: true };
}
