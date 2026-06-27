"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Icon } from "@/components/ui/icon";

/**
 * OAuth (Google/GitHub) return page. After the provider, if the new sign-up
 * needs bot verification, Clerk renders the CAPTCHA into #clerk-captcha — here
 * it's on its OWN screen with a clear heading and nothing else, so the user
 * can't miss it. For clean sign-ups with no challenge, the callback just
 * forwards to /dashboard.
 */
// Clerk components require <ClerkProvider>, which the root layout only mounts
// when Clerk keys are present. Mirror that gate here so an env-less build (no
// keys) doesn't crash prerendering this page. In production the key is set, so
// the callback renders exactly as before.
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SSOCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-jade-500/40 bg-card p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-jade-500/15 text-jade-600">
          <Icon name="ShieldCheck" className="h-6 w-6" />
        </span>
        <h1 className="font-display text-xl font-bold text-foreground">Verify you&apos;re human</h1>
        <p className="mt-2 text-sm text-muted-foreground">One quick check before we finish creating your account.</p>

        {/* The CAPTCHA mounts here — on its own, no other fields around it. */}
        <div id="clerk-captcha" data-cl-size="flexible" data-cl-theme="light" className="mt-6 flex min-h-[72px] items-center justify-center" />

        {clerkEnabled && (
          <AuthenticateWithRedirectCallback signUpForceRedirectUrl="/dashboard" signInForceRedirectUrl="/dashboard" />
        )}
      </div>
    </main>
  );
}
