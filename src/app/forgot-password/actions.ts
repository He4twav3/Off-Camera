"use server";

import { requestPasswordReset } from "@/lib/users";
import { sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/request-url";

export type ForgotPasswordState = {
  error?: string;
  submitted?: boolean;
  /** Only set when the account actually exists — see the comment below on
   * why this doesn't leak existence to the UI either way. */
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
    await sendEmail({
      to: email,
      subject: "Reset your password — Off Camera",
      bodyText: `Reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    });
    return { submitted: true, devLink: resetUrl };
  }

  return { submitted: true };
}
