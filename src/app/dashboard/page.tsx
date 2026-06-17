import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OrgControls } from "./org-controls";
import { WriteTestButton } from "./write-test-button";
import { PendingIdea } from "./pending-idea";

export const metadata = { title: "Integration test" };
export const dynamic = "force-dynamic"; // always read fresh auth + DB

function StatusRow({ ok, label, value }: { ok: boolean; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-0">
      <span className="mt-0.5 text-lg leading-none">{ok ? "✅" : "❌"}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="mt-0.5 break-words font-mono text-sm text-muted-foreground">{value}</div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { userId, orgId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const claims = (sessionClaims ?? {}) as Record<string, unknown>;
  const claimRole = typeof claims.role === "string" ? claims.role : null;
  const claimOrgId = typeof claims.org_id === "string" ? claims.org_id : null;

  // Read test — proves Supabase accepts the Clerk token (no auth error).
  let supaOk = false;
  let supaMessage: string;
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    supaMessage = "Supabase env vars are not set.";
  } else {
    const { data, error } = await supabase.from("sites").select("id");
    if (error) {
      supaMessage = `Supabase rejected the request: ${error.message}`;
    } else {
      supaOk = true;
      supaMessage = `Supabase accepted your Clerk token — ${data?.length ?? 0} site(s) visible to your tenant.`;
    }
  }

  const email = user?.emailAddresses[0]?.emailAddress ?? "(no email)";

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">// integration test</p>
          <h1 className="font-display text-2xl font-bold text-foreground">Clerk → Supabase bridge</h1>
        </div>
        <OrgControls />
      </div>

      <PendingIdea />

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <StatusRow ok={Boolean(userId)} label="Clerk auth" value={`Signed in as ${email} (${userId})`} />
        <StatusRow
          ok={claimRole === "authenticated"}
          label={'role claim = "authenticated"'}
          value={
            claimRole
              ? `role: ${claimRole}`
              : "missing — confirm the Supabase integration is activated in Clerk"
          }
        />
        <StatusRow
          ok={Boolean(claimOrgId)}
          label="org_id claim (your custom session-token claim)"
          value={
            claimOrgId
              ? `org_id: ${claimOrgId}${orgId && orgId !== claimOrgId ? ` (Clerk active org: ${orgId})` : ""}`
              : "empty — you have no active organization, OR the org_id custom claim isn't saved in Clerk"
          }
        />
        <StatusRow ok={supaOk} label="Supabase read" value={supaMessage} />
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-1 font-display text-base font-semibold text-foreground">Conclusive write test</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Inserts a tenant-scoped row into <code className="font-mono">sites</code> and reads it back. Succeeds only if
          the token, the <code className="font-mono">org_id</code> claim, and the RLS write policy all line up. (Creates
          a real row you can delete later.)
        </p>
        <WriteTestButton />
      </section>

      <details className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">Raw session token claims</summary>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground">
          {JSON.stringify(claims, null, 2)}
        </pre>
      </details>
    </main>
  );
}
