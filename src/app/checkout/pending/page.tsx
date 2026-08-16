import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Confirming your payment",
  robots: { index: false, follow: false },
};

// Where NOWPayments sends the browser back after checkout — not a
// success page, because crypto payments aren't confirmed the instant
// the browser gets here (see api/webhooks/nowpayments). Access is
// granted once the IPN webhook actually sees it settle on-chain.
export default function CheckoutPendingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-secondary/30 px-4 py-16 text-center">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-8">
        <span className="pill-outline mx-auto flex size-14 items-center justify-center rounded-full bg-toy-soft text-toy-soft-foreground">
          <Clock className="size-7" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Confirming your payment
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Crypto payments settle on-chain, not instantly — this can take a
          few minutes depending on the network. We&apos;ll email you the
          moment it&apos;s confirmed, with a link straight into your
          dashboard.
        </p>

        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link href="/" />}
          className="mt-6 w-full"
        >
          Back to home
        </Button>
      </div>
    </div>
  );
}
