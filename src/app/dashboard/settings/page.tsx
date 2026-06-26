import { auth, currentUser } from "@clerk/nextjs/server";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { Icon } from "@/components/ui/icon";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const { orgId } = await auth();
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "—";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Account and workspace.</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-display font-semibold text-foreground">Account</h2>
        <Row label="Email" value={email} />
        <Row label="Current workspace" value={orgId ? "Organization (team)" : "Individual"} />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 font-display font-semibold text-foreground">Workspace</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Switch between your personal account and team organizations, or create a team.
        </p>
        <OrganizationSwitcher
          hidePersonal={false}
          afterSelectOrganizationUrl="/dashboard"
          afterCreateOrganizationUrl="/dashboard"
          appearance={{ variables: { colorPrimary: "#10B981" } }}
        />
      </section>

    </div>
  );
}
