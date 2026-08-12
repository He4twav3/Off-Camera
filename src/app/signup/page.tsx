import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create your account",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-secondary/30 px-4 py-16">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real accounts, checked by password — see how it works on the
          account page once you&apos;re in.
        </p>

        <div className="mt-6">
          <SignupForm />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Not enrolled yet?{" "}
        <Link
          href="/course#pricing"
          className="font-medium text-foreground underline underline-offset-2"
        >
          See the course
        </Link>
      </p>
    </div>
  );
}
