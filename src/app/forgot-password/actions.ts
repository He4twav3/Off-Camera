"use server";

import { requestPasswordReset } from "@/lib/users";
import { sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/request-url";
import { ResetPasswordEmail } from "@/emails/reset-password-email";

export type ForgotPasswordState = {
  error?: string;
  submitted?: boolean;
  /** Only set when the account exists AND the email genuinely wasn't
   * delivered (no provider configured, or the provider rejected it) —
   * see mailer.ts's `delivery` field and the comment below on why an
   * existing-but-delivered account still doesn't leak via this field. */
  devLink?: string;
};

/**
 * Always returns the same "submitted" shape regardless of whether the
 * account exists — a real password-reset endpoint shouldn't let someone
 * probe which emails have accounts by watching for a different response.
 * The one difference (devLink present or not) only matters to whoever is
 * looking at *this exact response*, which in a real deployment would be
 * nobody but the actual account owner (the real link goes to their inbox
 * instead) — see mailer.ts for why that's not the case in this build.
 */
export async function requestReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const result = await requestPasswordReset(email);

  if (result.exists && result.token) {
    const baseUrl = await getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${result.token}`;
    const { delivery } = await sendEmail({
      to: email,
      subject: "Reset your password — Off Camera",
      react: ResetPasswordEmail({ resetUrl }),
      text: `Reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    });
    return { submitted: true, devLink: delivery === "sent" ? undefined : resetUrl };
  }

  return { submitted: true };
}
