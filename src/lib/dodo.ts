import DodoPayments from "dodopayments";
import { siteConfig } from "@/lib/site-config";

/**
 * Real card payments via Dodo Payments (a Merchant of Record — see
 * fulfillment.ts and the checkout routes for what that changes) when
 * DODO_PAYMENTS_API_KEY is set — otherwise `dodo` stays null and the
 * checkout page disables the card option instead of crashing, same
 * fallback shape as mailer.ts's Resend client and nowpayments.ts.
 *
 * Defaults to test_mode even though the SDK itself defaults to
 * live_mode when unset — safer to require an explicit opt-in
 * (DODO_PAYMENTS_ENVIRONMENT=live_mode) before this can ever move real
 * money, rather than silently going live because a var was left unset.
 */
const environment = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";

export const dodo = process.env.DODO_PAYMENTS_API_KEY
  ? new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment,
    })
  : null;

/** The Dodo "product" id representing the course — created once via
 * their API, referenced here for checkout sessions. */
export const DODO_PRODUCT_ID = process.env.DODO_PAYMENTS_PRODUCT_ID;

/** Dodo's hosted checkout has separate test/live hostnames — same
 * environment switch as the API client above, kept in sync with it. */
export function dodoCheckoutBaseUrl(): string {
  return environment === "test_mode"
    ? "https://test.checkout.dodopayments.com"
    : "https://checkout.dodopayments.com";
}

export function courseProductInput() {
  return {
    name: siteConfig.name,
    description: siteConfig.description,
    price: {
      currency: siteConfig.price.currency as "EUR",
      price: Math.round(siteConfig.price.amount * 100),
      discount: 0,
      purchasing_power_parity: false,
      type: "one_time_price" as const,
    },
    tax_category: "digital_products" as const,
  };
}
