import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { CreateAccountForm } from "./create-account-form";
import "@/styles/dark-invert.css";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

// Email + password account. Separate from /signup, which is the free-preview
// capture page that emails a sign-in link and sets no password.
export default function CreateAccountPage() {
  return (
    <div className="dark-invert flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-md rounded-2xl bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">Join as a creator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your account, then we&apos;ll ask about your content. We&apos;ll email you a code to confirm it.
        </p>
        <div className="mt-6">
          <CreateAccountForm />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
