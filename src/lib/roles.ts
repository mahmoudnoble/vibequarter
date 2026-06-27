import "server-only";
import { auth } from "@clerk/nextjs/server";

/**
 * Roles for the multi-tenant SaaS.
 *
 * - SUPER-ADMIN = the platform owner(s). Identified by an env allowlist of Clerk
 *   user ids (SUPER_ADMIN_USER_IDS, comma-separated). Independent of any org, so
 *   the super-admin is recognised in any/no org context. They manage clinics and
 *   read across clinics via the service-role client.
 * - RECEPTIONIST = a signed-in user with an active clinic org (orgId) who is NOT
 *   in the allowlist. RLS (owner_id = current_tenant() = orgId) already isolates
 *   them to their one clinic — no extra data-layer gating needed.
 *
 * This is the single source of truth; admin server actions/routes must call
 * requireSuperAdmin() and never trust a client-supplied owner/clinic id.
 */

export type Role = "super_admin" | "receptionist" | "none";

export function superAdminIds(): string[] {
  return (process.env.SUPER_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isSuperAdminId(userId: string | null | undefined): boolean {
  return !!userId && superAdminIds().includes(userId);
}

export async function isSuperAdmin(): Promise<boolean> {
  const { userId } = await auth();
  return isSuperAdminId(userId);
}

export async function currentRole(): Promise<Role> {
  const { userId, orgId } = await auth();
  if (!userId) return "none";
  if (isSuperAdminId(userId)) return "super_admin";
  return orgId ? "receptionist" : "none";
}

/** Guard: throws unless the caller is a super-admin. First line of admin actions. */
export async function requireSuperAdmin(): Promise<void> {
  if (!(await isSuperAdmin())) throw new Error("forbidden");
}

/** Guard: throws unless the caller belongs to a clinic (org member) or is a super-admin. */
export async function requireClinicMember(): Promise<void> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("forbidden");
  if (isSuperAdminId(userId)) return;
  if (!orgId) throw new Error("forbidden");
}
