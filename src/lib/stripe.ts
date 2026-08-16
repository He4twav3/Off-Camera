import Stripe from "stripe";
import { siteConfig } from "@/lib/site-config";

/**
 * Real card payments via Stripe when STRIPE_SECRET_KEY is set — otherwise
 * `stripe` stays null and the checkout page disables the card option
 * instead of crashing (see checkout-form.tsx), same fallback shape as
 * mailer.ts's Resend client.
 *
 * No `apiVersion` pinned here on purpose — omitting it uses whatever
 * version this SDK build (see package.json) itself defaults to, so it
 * can't silently drift from what the installed types actually match.
 */
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** Course price in Stripe's smallest-currency-unit integer form (cents
 * for EUR) — Stripe amounts are never floats, to avoid float rounding
 * ever being able to under/overcharge someone. */
export function coursePriceInMinorUnits(): number {
  return Math.round(siteConfig.price.amount * 100);
}

/**
 * Creates a PaymentIntent for exactly the course's price — the amount
 * and currency always come from siteConfig server-side, never from
 * anything the client sends, so there's no way to submit a payment for
 * less than the real price. The buyer's email goes in `metadata` (not
 * `receipt_email`, though Stripe will also use it for that) because
 * that's what the webhook and confirm route read back out to know which
 * account to grant access to — see fulfillment.ts.
 */
export async function createCheckoutPaymentIntent(
  email: string
): Promise<{ ok: true; clientSecret: string } | { ok: false; error: string }> {
  if (!stripe) {
    return { ok: false, error: "Card payments aren't configured yet." };
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const intent = await stripe.paymentIntents.create({
    amount: coursePriceInMinorUnits(),
    currency: siteConfig.price.currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    receipt_email: normalizedEmail,
    metadata: { email: normalizedEmail, product: "off-camera-course" },
  });

  if (!intent.client_secret) {
    return { ok: false, error: "Could not start checkout. Try again." };
  }
  return { ok: true, clientSecret: intent.client_secret };
}
