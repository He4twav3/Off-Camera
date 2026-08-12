import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, CircleX } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/lib/users";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;

  const result =
    email && token
      ? await verifyEmailToken(email, token)
      : { ok: false as const, error: "This verification link is missing its email or token." };

  const session = await getSession();
  const continueHref = session ? "/dashboard" : "/login";

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-secondary/30 px-4 py-16">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-6 text-center sm:p-8">
        {result.ok ? (
          <>
            <CircleCheck className="mx-auto size-10 text-primary" />
            <h1 className="mt-3 text-xl font-semibold tracking-tight">
              Email verified
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {email} is confirmed. You&apos;re all set.
            </p>
          </>
        ) : (
          <>
            <CircleX className="mx-auto size-10 text-destructive" />
            <h1 className="mt-3 text-xl font-semibold tracking-tight">
              Verification failed
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{result.error}</p>
          </>
        )}

        <Button
          className="btn-sticker mt-6 w-full"
          nativeButton={false}
          render={<Link href={continueHref} />}
        >
          {session ? "Go to dashboard" : "Sign in"}
        </Button>
      </div>
    </div>
  );
}
