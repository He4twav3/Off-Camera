"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { createUser } from "@/lib/users";
import { sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/request-url";
import { VerifyEmailEmail } from "@/emails/verify-email";

export type SignupState = { error?: string };

/** Creates a new account only — rejects if the email is already taken
 * (unlike the old combined login form, this never silently signs someone
 * into an existing account). See login/actions.ts for the sign-in-only
 * counterpart. */
export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const result = await createUser(email, password);
  if (!result.ok) return { error: result.error };

  const baseUrl = await getBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(email.toLowerCase())}&token=${result.verifyToken}`;
  await sendEmail({
    to: email.toLowerCase(),
    subject: "Verify your email — Off Camera",
    react: VerifyEmailEmail({ verifyUrl }),
    text: `Welcome to Off Camera! Verify your email to confirm it's really you:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, email.toLowerCase(), SESSION_COOKIE_OPTIONS);

  redirect("/dashboard");
}
