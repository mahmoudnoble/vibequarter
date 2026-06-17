import { SignUp } from "@clerk/nextjs";

export const metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <SignUp appearance={{ variables: { colorPrimary: "#10B981", borderRadius: "12px" } }} />
    </main>
  );
}
