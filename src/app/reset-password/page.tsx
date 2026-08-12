import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;
  const valid = Boolean(email && token);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-secondary/30 px-4 py-16">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-6 sm:p-8">
        {valid ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              For {email}
            </p>
            <div className="mt-6">
              <ResetPasswordForm email={email!} token={token!} />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight">
              Invalid reset link
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              This link is missing its email or token. Request a new one to
              reset your password.
            </p>
            <Link
              href="/forgot-password"
              className="btn-sticker mt-6 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold"
            >
              Request a new link
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
