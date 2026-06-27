import { isSuperAdmin } from "@/lib/roles";
import { listClinicUsage } from "@/lib/admin/usage";
import { AdminConsole } from "./admin-console";

export const metadata = { title: "Clinics — admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isSuperAdmin())) return null; // layout already redirects; belt-and-suspenders
  const clinics = await listClinicUsage();
  return <AdminConsole clinics={clinics} />;
}
