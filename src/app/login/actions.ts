"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

/**
 * Sign-in only — a real password check against Supabase Auth, which
 * owns its own abuse-protection/rate-limiting internally now (no more
 * hand-rolled MAX_FAILED_ATTEMPTS/lockout on our side). One generic
 * error for both "no such account" and "wrong password" — Supabase's
 * own `signInWithPassword` already returns the same generic message for
 * both, which is the correct behavior (distinguishing them lets an
 * attacker enumerate which emails have accounts).
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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Incorrect email or password." };
  }

  redirect("/dashboard");
}
