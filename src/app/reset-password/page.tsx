import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { getSession } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

/**
 * By the time someone lands here, the recovery link from
 * forgot-password/actions.ts has already been clicked and verified via
 * /auth/callback, which established a real (if limited-purpose)
 * session — so this just checks that a session exists, not a `?token=`
 * query param the way it used to.
 */
export default async function ResetPasswordPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-secondary/30 px-4 py-16">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-6 sm:p-8">
        {session ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">For {session.email}</p>
            <div className="mt-6">
              <ResetPasswordForm />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight">
              Invalid reset link
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              This link is invalid or has expired. Request a new one to
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
