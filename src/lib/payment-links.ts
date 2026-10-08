/**
 * How a creator is paid: a payment link from their own Stripe, PayPal or Wise account.
 * The brand opens the link and pays the creator directly; we never hold or see the money.
 * The processor takes its fee from what the creator receives.
 *
 * Pure (no server imports). Only these providers' own addresses are accepted, so a link
 * saved here can safely be shown to a brand as a button.
 */

export type PaymentProvider = "stripe" | "paypal" | "wise";

export const PAYMENT_PROVIDERS: Record<
  PaymentProvider,
  {
    label: string;
    hosts: string[];
    signupUrl: string;
    blurb: string;
    howTo: string;
  }
> = {
  stripe: {
    label: "Stripe",
    hosts: ["buy.stripe.com"],
    signupUrl: "https://dashboard.stripe.com/register",
    blurb: "Best for brands paying by card. Not available in every country.",
    howTo:
      "In Stripe, open Payment links, create one, and copy it. It starts with buy.stripe.com.",
  },
  paypal: {
    label: "PayPal",
    hosts: ["paypal.me", "www.paypal.me", "paypal.com", "www.paypal.com"],
    signupUrl: "https://www.paypal.com/signup",
    blurb: "Works in most countries.",
    howTo: "Create your PayPal.me link and copy it. It looks like paypal.me/yourname.",
  },
  wise: {
    label: "Wise",
    hosts: ["wise.com", "www.wise.com", "wise.me"],
    signupUrl: "https://wise.com/register",
    blurb: "Usually the cheapest for larger bank transfers.",
    howTo: "In Wise, create a payment link and copy it.",
  },
};

export type PaymentLinkResult =
  | { ok: true; provider: PaymentProvider; value: string }
  | { ok: false; error: string };

/** The provider a saved value belongs to, or null when it isn't a link we accept. */
export function providerOfLink(raw: string | null | undefined): PaymentProvider | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  for (const [key, p] of Object.entries(PAYMENT_PROVIDERS)) {
    if (p.hosts.includes(host)) return key as PaymentProvider;
  }
  return null;
}

/** Validates the link a creator pastes. */
export function parsePaymentLink(raw: string): PaymentLinkResult {
  const value = raw.trim();
  if (value.length < 12)
    return { ok: false, error: "Paste your payment link, starting with https://" };
  if (value.length > 300) return { ok: false, error: "That link is too long." };
  const provider = providerOfLink(value);
  if (!provider) {
    return {
      ok: false,
      error:
        "That isn't a Stripe, PayPal or Wise payment link. Create one in your account and paste it here. It has to start with https://",
    };
  }
  return { ok: true, provider, value };
}
