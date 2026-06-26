import { redirect } from "next/navigation";

// VibeQuarter is the clinic-operations AI agent — the marketing/website surfaces
// were removed. The root goes straight to the dashboard (which sends signed-out
// visitors to /sign-in).
export default function Home() {
  redirect("/dashboard");
}
