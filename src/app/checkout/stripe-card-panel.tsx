"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { createStripePaymentIntentAction } from "./actions";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// Matches the site's cream/ink/terracotta identity within what Stripe's
// Elements appearance API actually exposes — no hard box-shadow
// "sticker" borders here (Elements has no equivalent), just the same
// color tokens and a 2px ink border/focus ring, same as every other
// input on the site.
const appearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#e14d28",
    colorBackground: "#fffffc",
    colorText: "#120c09",
    colorDanger: "#c8402a",
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    borderRadius: "10px",
  },
  rules: {
    ".Input": { border: "2px solid #120c09", boxShadow: "none" },
    ".Input:focus": {
      border: "2px solid #120c09",
      boxShadow: "0 0 0 3px rgba(225, 77, 40, 0.35)",
    },
    ".Tab": { border: "2px solid #120c09" },
    ".Tab--selected": { border: "2px solid #120c09", backgroundColor: "#f4e9dd" },
  },
};

/**
 * Creates the PaymentIntent as soon as a valid email is entered (not on
 * form submit) — Stripe's PaymentElement needs a real clientSecret to
 * mount at all, so it can't wait for a submit that hasn't happened yet.
 */
// Every state this panel can be in for a given email, as one value
// instead of separate clientSecret/error/loading flags — that way the
// effect below only ever calls setStatus from inside its async
// callback, never synchronously in the effect body itself, and
// "loading" isn't a flag to separately set/unset so much as just
// whatever's true while status is still "pending".
type IntentStatus =
  | { state: "pending" }
  | { state: "ready"; clientSecret: string }
  | { state: "error"; error: string };

export function StripeCardPanel({ email, emailValid }: { email: string; emailValid: boolean }) {
  const [status, setStatus] = useState<IntentStatus>({ state: "pending" });

  useEffect(() => {
    if (!emailValid || !stripePromise) return;
    let cancelled = false;
    createStripePaymentIntentAction(email.trim()).then((result) => {
      if (cancelled) return;
      setStatus(
        result.status === "ready"
          ? { state: "ready", clientSecret: result.clientSecret }
          : { state: "error", error: result.status === "error" ? result.error : "Could not start checkout." }
      );
    });
    return () => {
      cancelled = true;
    };
    // Deliberately keyed only on emailValid, not every keystroke — the
    // PaymentIntent's receipt_email/metadata is fixed at creation, so
    // re-creating one on every character typed would spam Stripe's API
    // and blow away the payment form mid-type.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailValid]);

  if (!stripePromise) {
    return (
      <p className="rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground">
        Card payments aren&apos;t configured yet.
      </p>
    );
  }

  if (!emailValid) {
    return (
      <p className="rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground">
        Enter your email above to continue.
      </p>
    );
  }

  if (status.state === "error") {
    return <p className="text-sm font-medium text-destructive">{status.error}</p>;
  }

  if (status.state === "pending") {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading payment form…
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret: status.clientSecret, appearance }}>
      <StripePaymentInner />
    </Elements>
  );
}

function StripePaymentInner() {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    // Stripe handles 3D Secure / bank-side redirects itself as needed;
    // this only ever resolves here on immediate failure (bad card, etc)
    // — success navigates away to return_url instead of resolving.
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/api/checkout/stripe/confirm`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <Button
        type="submit"
        size="lg"
        disabled={!stripe || submitting}
        className="btn-sticker w-full"
      >
        {submitting ? "Processing…" : "Complete purchase"}
      </Button>
    </form>
  );
}
