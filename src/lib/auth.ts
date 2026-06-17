/**
 * Graceful-degradation auth flag. The app renders WITHOUT Clerk keys (preview
 * mode); when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is present, real Clerk auth +
 * organizations (multi-tenancy) + billing switch on automatically.
 */
export const authEnabled: boolean = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const mockTenant = {
  user: { fullName: "Alex Morgan", initials: "AM" },
  org: { name: "Northlight Studio", slug: "northlight" },
} as const;
