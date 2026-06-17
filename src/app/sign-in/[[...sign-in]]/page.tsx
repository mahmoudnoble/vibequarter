import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <SignIn appearance={{ variables: { colorPrimary: "#10B981", borderRadius: "12px" } }} />
    </main>
  );
}
