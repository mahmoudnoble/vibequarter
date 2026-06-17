"use client";

import { useEffect, useRef, useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";

type Strategy = "oauth_google" | "oauth_github";

const errMsg = (e: unknown) => {
  const x = e as { errors?: Array<{ message?: string }> } | undefined;
  return x?.errors?.[0]?.message ?? "Something went wrong. Please try again.";
};

const providerLabel: Record<Strategy, string> = { oauth_google: "Google", oauth_github: "GitHub" };

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export default function SignUpPage() {
  const ctx = useSignUp();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "oauth" | "verify">("form");
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fired = useRef(false);

  // Kick off OAuth only AFTER the captcha-only screen has mounted, so the
  // #clerk-captcha element exists there (prominent, on its own) for Clerk to
  // render the challenge into before redirecting to the provider.
  useEffect(() => {
    if (step !== "oauth" || !strategy || !ctx.isLoaded || fired.current) return;
    fired.current = true;
    ctx.signUp
      .authenticateWithRedirect({ strategy, redirectUrl: "/sso-callback", redirectUrlComplete: "/dashboard" })
      .catch((e) => {
        setError(errMsg(e));
        setStep("form");
        fired.current = false;
      });
  }, [step, strategy, ctx.isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ctx.isLoaded) {
    return <main className="min-h-screen bg-background" />;
  }
  const { signUp, setActive } = ctx;

  const startOauth = (s: Strategy) => {
    setError(null);
    setStrategy(s);
    setStep("oauth");
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete" && res.createdSessionId) {
        await setActive({ session: res.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Couldn't complete verification. Please try again.");
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        {step === "oauth" ? (
          // CAPTCHA-only screen: nothing but the heading + the challenge.
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-jade-500/15 text-jade-600">
              <Icon name="ShieldCheck" className="h-6 w-6" />
            </span>
            <h1 className="font-display text-xl font-bold text-foreground">Verify you&apos;re human</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Quick check, then we&apos;ll continue to {strategy ? providerLabel[strategy] : "your provider"}.
            </p>
            <div id="clerk-captcha" data-cl-size="flexible" data-cl-theme="light" className="mt-6 flex min-h-[72px] items-center justify-center" />
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>
        ) : step === "verify" ? (
          <form onSubmit={verify} className="space-y-3">
            <h1 className="font-display text-2xl font-bold text-foreground">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              Enter the code we sent to <span className="font-semibold text-foreground">{email}</span>.
            </p>
            {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-foreground">{error}</div>}
            <input
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Verification code"
              className="h-12 w-full rounded-lg border border-input bg-card px-3.5 text-center text-lg tracking-widest text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" disabled={busy} className={buttonClasses({ size: "md", className: "w-full" })}>
              {busy ? "Verifying…" : "Verify & continue"}
            </button>
          </form>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-foreground">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Start building your site in seconds.</p>

            {error && <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-foreground">{error}</div>}

            <div className="mt-6 space-y-2.5">
              <button type="button" onClick={() => startOauth("oauth_google")} className={buttonClasses({ variant: "secondary", size: "md", className: "w-full" })}>
                <GoogleIcon /> Continue with Google
              </button>
              <button type="button" onClick={() => startOauth("oauth_github")} className={buttonClasses({ variant: "secondary", size: "md", className: "w-full" })}>
                <Icon name="Github" className="h-[18px] w-[18px]" /> Continue with GitHub
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submitEmail} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-12 w-full rounded-lg border border-input bg-card px-3.5 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              {/* CAPTCHA for the email path mounts here (when bot protection triggers). */}
              <div id="clerk-captcha" data-cl-size="flexible" data-cl-theme="light" className="flex justify-center pt-1" />
              <button type="submit" disabled={busy} className={buttonClasses({ size: "md", className: "w-full" })}>
                {busy ? "Creating…" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-semibold text-jade-600 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
