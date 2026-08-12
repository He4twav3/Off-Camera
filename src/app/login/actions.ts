"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { verifyUser } from "@/lib/users";

export type LoginState = { error?: string };

/**
 * Sign-in only — a wrong email now says so and points at /signup, rather
 * than silently creating a new account for it (that's a separate, explicit
 * flow now — see signup/actions.ts). Real password check, including real
 * lockout after too many wrong attempts (see verifyUser).
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
  if (!password) {
    return { error: "Enter your password." };
  }

  const result = await verifyUser(email, password);
  if (!result.ok) return { error: result.error };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, email.toLowerCase(), SESSION_COOKIE_OPTIONS);

  redirect("/dashboard");
}
