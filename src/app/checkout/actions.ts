"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { ensureUser } from "@/lib/users";
import { sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/request-url";
import { VerifyEmailEmail } from "@/emails/verify-email";

export type CheckoutState = { error?: string };

export async function checkout(
  _prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const cardNumber = String(formData.get("cardNumber") ?? "").replace(/\s/g, "");
  const expiry = String(formData.get("expiry") ?? "").trim();
  const cvc = String(formData.get("cvc") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (!name) {
    return { error: "Enter the name on the card." };
  }
  if (cardNumber.length < 12) {
    return { error: "Enter a valid card number." };
  }
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return { error: "Enter the expiry as MM/YY." };
  }
  if (cvc.length < 3) {
    return { error: "Enter a valid security code." };
  }

  // No real payment processor is wired up — nothing above is transmitted
  // or stored anywhere. This is the boundary where you'd integrate Stripe
  // (or similar) before going live: create a PaymentIntent/Checkout
  // Session server-side and confirm it here instead of just accepting
  // the form. Since "payment" trivially "succeeds," we sign the buyer in
  // immediately (most real course platforms do the same after a real
  // charge) so /checkout/success can send them straight to the dashboard.
  // A real account record is created for them too (see users.ts), so
  // their dashboard progress is genuinely theirs, not just this browser's.
  const { isNew, verifyToken } = await ensureUser(email);
  if (isNew && verifyToken) {
    const baseUrl = await getBaseUrl();
    const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(email.toLowerCase())}&token=${verifyToken}`;
    await sendEmail({
      to: email.toLowerCase(),
      subject: "Verify your email — Off Camera",
      react: VerifyEmailEmail({ verifyUrl }),
      text: `Welcome to Off Camera! Verify your email to confirm it's really you:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    });
  }
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, email.toLowerCase(), SESSION_COOKIE_OPTIONS);

  redirect("/checkout/success");
}
