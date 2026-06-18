import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/actions/sync-user";
import { DashboardSidebar } from "./sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Mirror the Clerk user into Supabase on each visit (delete-sync is handled by
  // the dev daemon / a Clerk webhook in prod — see the launch checklist).
  await syncUser();

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
