"use server";

import { createCryptoCheckout } from "@/lib/nowpayments";
import { getBaseUrl } from "@/lib/request-url";

/**
 * Neither of these grant access on their own — they only start a real
 * charge with a real processor. Access is granted exclusively by
 * fulfillPurchase() (see fulfillment.ts), called from a confirmed
 * payment: Dodo's webhook + the browser's return from its hosted
 * checkout for cards, NOWPayments' IPN webhook for crypto.
 *
 * Card checkout has no action here — unlike Stripe's embedded Elements
 * form, Dodo's checkout is a redirect to their own hosted page, so the
 * "Card" button in checkout-form.tsx is just a plain link to
 * api/checkout/dodo, no client/server round-trip needed first.
 */

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
