import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "You're in",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage() {
  const session = await getSession();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-secondary/30 px-4 py-16 text-center">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-8">
        <span className="pill-outline mx-auto flex size-14 items-center justify-center rounded-full bg-toy-soft text-toy-soft-foreground">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          You&apos;re in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session
            ? `Signed in as ${session.email}. `
            : ""}
          Your course is unlocked. Head to your dashboard to start module 1.
        </p>

        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/dashboard" />}
          className="btn-sticker mt-6 w-full"
        >
          Go to your dashboard
        </Button>
      </div>
    </div>
  );
}
