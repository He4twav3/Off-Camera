import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUser, markUserPaid } from "@/lib/profiles";
import { sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/request-url";
import { WelcomePurchaseEmail } from "@/emails/welcome-purchase-email";

/**
 * The single place a payment turns into real course access. Called from
 * two independent paths for each provider — Dodo's webhook AND the
 * browser's own return-URL confirm route; NOWPayments' IPN webhook only
 * (crypto has no reliable synchronous confirmation, see nowpayments.ts)
 * — so whichever one fires first does the real work, and the other is a
 * no-op thanks to markUserPaid's idempotency. Never called with anything
 * a browser submitted directly; only with a reference the payment
 * provider's own API has already confirmed as paid.
 */
export async function fulfillPurchase({
  email,
  provider,
  reference,
}: {
  email: string;
  provider: "dodo" | "nowpayments";
  reference: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { ok: false, error: `Payment ${reference} has no usable email in its metadata.` };
  }

  const { isNew } = await ensureUser(normalizedEmail);

  const result = await markUserPaid(normalizedEmail, provider, reference);
  if (!result.ok) return result;

  // Only the first fulfillment of a brand-new account sends the welcome
  // email — a duplicate webhook delivery for the same payment shouldn't
  // re-send it. This is a "claim your account" link, not a plain verify
  // link: an account created here has no password the buyer knows (see
  // ensureUser) and, for crypto in particular, no browser was present to
  // sign anyone in when payment actually cleared — so this link has to
  // be the way in. generateLink both mints the token and returns the
  // real Supabase verify URL, no hand-built token/route needed.
  if (isNew) {
    const baseUrl = await getBaseUrl();
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      // /auth/confirm, not /auth/callback — admin.generateLink() always
      // produces an implicit-flow (hash-fragment) link, which needs the
      // client-side handler, not the PKCE-only server route. See
      // auth/confirm/page.tsx's own comment for why.
      options: { redirectTo: `${baseUrl}/auth/confirm?next=/dashboard` },
    });

    if (error || !data.properties?.action_link) {
      // Payment + account + paid status all already succeeded above —
      // a failed notification email should never roll that back. Same
      // principle mailer.ts already holds itself to.
      console.error("fulfillPurchase: could not generate claim link:", error);
      return { ok: true };
    }

    await sendEmail({
      to: normalizedEmail,
      subject: "You're in — On Camera",
      react: WelcomePurchaseEmail({ claimUrl: data.properties.action_link }),
      text: `Your payment went through! Sign in and start the course:\n\n${data.properties.action_link}\n\nThis link expires in 24 hours.`,
    });
  }

  return { ok: true };
}
