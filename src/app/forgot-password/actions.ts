"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/mailer";
import { ResetPasswordEmail } from "@/emails/reset-password-email";
import { getBaseUrl } from "@/lib/request-url";
import { clientIp, rateLimit, TOO_MANY } from "@/lib/rate-limit";

export type ForgotPasswordState = {
  error?: string;
  submitted?: boolean;
};

/**
 * Always returns the same "submitted" shape regardless of whether the
 * account exists — a real password-reset endpoint shouldn't let someone
 * probe which emails have accounts by watching for a different
 * response. `resetPasswordForEmail` itself already returns `{error:
 * null}` either way for exactly this reason.
 *
 * Mints the recovery link with admin.generateLink and sends it through our
 * own branded ResetPasswordEmail (Supabase's default template is white).
 * That link is implicit-flow, so it lands on /auth/confirm, which sets the
 * session client-side, then continues to /reset-password.
 */
export async function requestReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  if (!rateLimit(`reset:${await clientIp()}`, 6, 10 * 60_000)) return { error: TOO_MANY };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const baseUrl = await getBaseUrl();
  const { data, error } = await createAdminClient().auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${baseUrl}/auth/confirm?next=/reset-password` },
  });
  // Unknown email: stay silent so the response never reveals who has an account.
  if (!error && data.properties?.action_link) {
    await sendEmail({
      to: email,
      subject: "Reset your password — On Camera",
      react: ResetPasswordEmail({ resetUrl: data.properties.action_link }),
      text: `Reset your On Camera password:\n\n${data.properties.action_link}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    });
  }

  return { submitted: true };
}
