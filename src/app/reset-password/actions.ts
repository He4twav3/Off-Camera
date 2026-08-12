"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { resetPasswordWithToken } from "@/lib/users";

export type ResetPasswordState = { error?: string };

/** A valid token already proves ownership of the account (it only ever
 * reached this exact link, see mailer.ts), so this signs the user
 * straight in afterward instead of sending them back to /login to type
 * the password they just set. */
export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !token) {
    return { error: "This reset link is invalid. Request a new one." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const result = await resetPasswordWithToken(email, token, password);
  if (!result.ok) return { error: result.error };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, email, SESSION_COOKIE_OPTIONS);

  redirect("/dashboard");
}
