import { ensureUser, markUserPaid } from "@/lib/users";
import { sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/request-url";
import { WelcomePurchaseEmail } from "@/emails/welcome-purchase-email";

/**
 * The single place a payment turns into real course access. Called from
 * two independent paths for each provider — Stripe's webhook AND the
 * browser's own return-URL confirm route; NOWPayments' IPN webhook AND
 * its success-URL confirm route — so whichever one fires first does the
 * real work, and the other is a no-op thanks to markUserPaid's
 * idempotency. Never called with anything a browser submitted directly;
 * only with a reference the payment provider's own API has already
 * confirmed as paid (see the two confirm routes and two webhook routes).
 */
export async function fulfillPurchase({
  email,
  provider,
  reference,
}: {
  email: string;
  provider: "stripe" | "nowpayments";
  reference: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false, error: `Payment ${reference} has no usable email in its metadata.` };
  }

  const { isNew, verifyToken } = await ensureUser(normalizedEmail);

  const result = await markUserPaid(normalizedEmail, provider, reference);
  if (!result.ok) return result;

  // Only the first fulfillment of a brand-new account sends the welcome
  // email — a duplicate webhook delivery for the same payment shouldn't
  // re-send it. This is a "claim your account" link, not a plain verify
  // link: an account created here has no password (see ensureUser) and,
  // for crypto in particular, no browser was present to sign anyone in
  // when payment actually cleared (see the claim route's own comment) —
  // so this link has to be the way in, not just an email confirmation.
  if (isNew && verifyToken) {
    const baseUrl = await getBaseUrl();
    const claimUrl = `${baseUrl}/api/checkout/claim?email=${encodeURIComponent(normalizedEmail)}&token=${verifyToken}`;
    await sendEmail({
      to: normalizedEmail,
      subject: "You're in — Off Camera",
      react: WelcomePurchaseEmail({ claimUrl }),
      text: `Your payment went through! Sign in and start the course:\n\n${claimUrl}\n\nThis link expires in 24 hours.`,
    });
  }

  return { ok: true };
}
