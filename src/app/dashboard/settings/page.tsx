import { redirect } from "next/navigation";

// The standalone Settings page was removed — clinic config lives in Agent Setup
// (per clinic) and the super-admin console (per platform). Redirect any old link.
export default function SettingsPage() {
  redirect("/dashboard");
}
