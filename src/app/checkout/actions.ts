"use server";

import { createCheckoutPaymentIntent } from "@/lib/stripe";
import { createCryptoCheckout } from "@/lib/nowpayments";
import { getBaseUrl } from "@/lib/request-url";

/**
 * These no longer grant access on their own — they only start a real
 * charge with a real processor. Access is granted exclusively by
 * fulfillPurchase() (see fulfillment.ts), called from a confirmed
 * payment: Stripe's webhook + the browser's return from
 * stripe.confirmPayment() for cards, NOWPayments' IPN webhook for
 * crypto. Nothing here ever creates an account or signs anyone in.
 */

export type CreatePaymentIntentState =
  | { status: "idle" }
  | { status: "ready"; clientSecret: string }
  | { status: "error"; error: string };

export async function createStripePaymentIntentAction(
  email: string
): Promise<CreatePaymentIntentState> {
  const result = await createCheckoutPaymentIntent(email);
  if (!result.ok) return { status: "error", error: result.error };
  return { status: "ready", clientSecret: result.clientSecret };
}

export type CreateCryptoCheckoutState =
  | { status: "idle" }
  | { status: "ready"; checkoutUrl: string }
  | { status: "error"; error: string };

export async function createCryptoCheckoutAction(
  email: string
): Promise<CreateCryptoCheckoutState> {
  const baseUrl = await getBaseUrl();
  const result = await createCryptoCheckout({ email, baseUrl });
  if (!result.ok) return { status: "error", error: result.error };
  return { status: "ready", checkoutUrl: result.checkoutUrl };
}
