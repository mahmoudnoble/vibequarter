import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/roles";

export const dynamic = "force-dynamic";

// Super-admin-only surface. Defense-in-depth on top of the middleware allowlist
// gate and each action's requireSuperAdmin().
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isSuperAdmin())) redirect("/dashboard");
  return <>{children}</>;
}
