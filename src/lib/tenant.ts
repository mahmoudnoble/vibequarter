import "server-only";
import { auth } from "@clerk/nextjs/server";

/**
 * The hybrid tenant id for the current request: the active Clerk organization
 * id when one is selected, otherwise the personal user id (sub). This is the
 * value stamped on every tenant-scoped row's owner_id and read back by the RLS
 * current_tenant() helper. Returns null when unauthenticated.
 */
export async function getOwner(): Promise<string | null> {
  const { userId, orgId } = await auth();
  return orgId ?? userId ?? null;
}
