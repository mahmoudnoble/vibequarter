"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

/**
 * Clerk org switcher + user menu. Selecting/creating an org calls setActive and
 * reloads /dashboard, so the org_id claim refreshes on the next request.
 * (Requires Organizations to be enabled in the Clerk dashboard.)
 */
export function OrgControls() {
  return (
    <div className="flex items-center gap-4">
      <OrganizationSwitcher
        hidePersonal={false}
        afterCreateOrganizationUrl="/dashboard"
        afterSelectOrganizationUrl="/dashboard"
        appearance={{ variables: { colorPrimary: "#10B981" } }}
      />
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
