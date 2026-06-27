import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Graceful-degradation middleware — mirrors `authEnabled` in @/lib/auth.
 * With Clerk keys present, clerkMiddleware() refreshes the session token and
 * makes auth() available everywhere. Without keys (preview mode), it's a
 * pass-through so the site still renders. Add auth.protect() inside the
 * clerkMiddleware callback once /dashboard and other private routes exist.
 */
const authEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Central, default-deny protection for private routes — defense in depth on top
// of each page's own auth() check, and automatic coverage for future routes.
const isProtected = createRouteMatcher(["/dashboard(.*)"]);
// Super-admin-only surfaces (clinic management + cross-clinic console).
const isAdminRoute = createRouteMatcher(["/dashboard/admin(.*)", "/api/admin(.*)"]);

const superAdminIds = () =>
  (process.env.SUPER_ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const passthrough = () => NextResponse.next();

export default authEnabled
  ? clerkMiddleware(async (auth, req) => {
      if (isProtected(req)) await auth.protect();
      // Defense-in-depth for the admin surfaces (the real check is
      // requireSuperAdmin() inside each admin action/route).
      if (isAdminRoute(req)) {
        const { userId } = await auth();
        if (!userId || !superAdminIds().includes(userId)) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    })
  : passthrough;

export const config = {
  matcher: [
    // Run on everything except Next internals and static files…
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // …and always on API routes.
    "/(api|trpc)(.*)",
  ],
};
