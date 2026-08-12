"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { createUser, getUser, verifyUser } from "@/lib/users";
import { sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/request-url";

export type LoginState = { error?: string };

/**
 * Real sign-in: the first time an email is used, it creates the account
 * with that password (see users.ts). Every time after, the password has
 * to match, or this rejects it (including real lockout after too many
 * wrong attempts — see verifyUser) — this is not "any password works."
 */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const existing = await getUser(email);
  if (existing) {
    const result = await verifyUser(email, password);
    if (!result.ok) return { error: result.error };
  } else {
    const result = await createUser(email, password);
    if (!result.ok) return { error: result.error };

    const baseUrl = await getBaseUrl();
    const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(email.toLowerCase())}&token=${result.verifyToken}`;
    await sendEmail({
      to: email.toLowerCase(),
      subject: "Verify your email — Off Camera",
      bodyText: `Welcome to Off Camera! Verify your email to confirm it's really you:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, email.toLowerCase(), SESSION_COOKIE_OPTIONS);

  redirect("/dashboard");
}
