import { NowPaymentsSDK } from "@nowpaymentsio/nowpayments-sdk-nodejs";
import { siteConfig } from "@/lib/site-config";

/**
 * Real crypto payments via NOWPayments when NOWPAYMENTS_API_KEY is set —
 * otherwise `nowPayments` stays null and the checkout page disables the
 * crypto option instead of crashing, same fallback shape as dodo.ts
 * and mailer.ts.
 *
 * Unlike Dodo, this SDK has no built-in test/live switch — sandbox vs
 * production is just a different base URL with a completely separate
 * account/key (account-sandbox.nowpayments.io vs account.nowpayments.io).
 * Defaults to sandbox even though the SDK itself defaults to production
 * when baseUrl is unset — same "explicit opt-in required before this
 * can ever move real money" rule as dodo.ts's environment default.
 *
 * ipnCallbackUrl/successUrl/cancelUrl are deliberately NOT set here —
 * they depend on the actual request origin (localhost, a LAN IP, or the
 * real domain; see request-url.ts), which isn't known until a checkout
 * is actually being created, so they're passed per-call to
 * createCryptoCheckout() instead (createCheckout()'s input accepts the
 * same fields as per-call overrides).
 */
const NOWPAYMENTS_SANDBOX_BASE_URL = "https://api-sandbox.nowpayments.io/v1";

export const nowPayments = process.env.NOWPAYMENTS_API_KEY
  ? new NowPaymentsSDK({
      apiKey: process.env.NOWPAYMENTS_API_KEY,
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
      baseUrl:
        process.env.NOWPAYMENTS_ENVIRONMENT === "live_mode" ? undefined : NOWPAYMENTS_SANDBOX_BASE_URL,
    })
  : null;

/**
 * Creates a hosted NOWPayments checkout for exactly the course's price —
 * same "amount only ever comes from siteConfig server-side" rule as
 * Dodo's checkout route. The buyer's email goes in `orderId` —
 * NOWPayments' hosted-checkout input has no separate customer-email
 * field (that only exists on its two-step create-payment-from-invoice
 * flow, which this isn't using) — and the IPN webhook reads it back out
 * from there. See fulfillment.ts.
 *
 * Unlike Dodo's card checkout, there's no reliable client-side
 * confirmation step: crypto payments settle on a blockchain, not
 * instantly, so access is granted purely by the IPN webhook once
 * NOWPayments reports it as actually paid — the browser redirect back
 * is just a "we'll email you" page, not a confirmation.
 */
export async function createCryptoCheckout({
  email,
  baseUrl,
}: {
  email: string;
  baseUrl: string;
}): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: string }> {
  if (!nowPayments) {
    return { ok: false, error: "Crypto payments aren't configured yet." };
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  try {
    const checkout = await nowPayments.createCheckout({
      amount: siteConfig.price.amount,
      currency: siteConfig.price.currency.toLowerCase(),
      orderId: normalizedEmail,
      description: "Off Camera: Faceless Content & Brand Deals",
      ipnCallbackUrl: `${baseUrl}/api/webhooks/nowpayments`,
      successUrl: `${baseUrl}/checkout/pending`,
      cancelUrl: `${baseUrl}/checkout`,
    });
    if (!checkout.invoiceUrl) {
      return { ok: false, error: "Could not start crypto checkout. Try again." };
    }
    return { ok: true, checkoutUrl: checkout.invoiceUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not start crypto checkout.",
    };
  }
}
