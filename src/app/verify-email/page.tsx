import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

/**
 * Landing page after signup when email confirmation is required (see
 * signup/actions.ts). Supabase's own confirmation link goes straight to
 * /auth/callback, not here — this page never processes a `?token=` the
 * way it used to; it's purely a "check your inbox" waypoint now.
 */
export default async function VerifyEmailPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-secondary/30 px-4 py-16">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-6 text-center sm:p-8">
        <MailCheck className="mx-auto size-10 text-primary" />
        <h1 className="mt-3 text-xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {session
            ? `We sent a confirmation link to ${session.email}. Click it to verify your account.`
            : "We sent you a confirmation link — click it to verify your account and sign in."}
        </p>

        <Button
          className="btn-sticker mt-6 w-full"
          nativeButton={false}
          render={<Link href={session ? "/dashboard" : "/login"} />}
        >
          {session ? "Go to dashboard" : "Sign in"}
        </Button>
      </div>
    </div>
  );
}
