import { currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import type { Plan } from "@/lib/plans";

/** Super-admin = Clerk user with publicMetadata.role === "super_admin". */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await currentUser();
  return user?.publicMetadata?.role === "super_admin";
}

/** Read ALL plans (incl. inactive) with the service-role key — server-only,
 *  used by the gated admin page. */
export async function listAllPlans(): Promise<Plan[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key);
  const { data } = await supabase.from("plans").select("*").order("sort_order", { ascending: true });
  return (data ?? []).map((row) => ({
    ...(row as Plan),
    price_monthly: row.price_monthly == null ? null : Number(row.price_monthly),
    price_yearly: row.price_yearly == null ? null : Number(row.price_yearly),
  }));
}
