import { redirect } from "next/navigation";

// Self-service sign-up is disabled: the super-admin provisions every account
// (email + password) and sends the credentials to the client, who then signs in.
// Any hit to /sign-up is sent to the email+password sign-in page.
export default function SignUpPage() {
  redirect("/sign-in");
}
