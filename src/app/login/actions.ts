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

  // Go where they were headed (same-site paths only — an absolute URL here
  // would be an open redirect), otherwise to their own dashboard: creators
  // to the creator dashboard, everyone else to the main one.
  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/") && !next.startsWith("//")) redirect(next);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.user_metadata?.account_type === "brand") redirect("/brand");
  const { data: applicant } = user
    ? await supabase.from("applicants").select("id").eq("user_id", user.id).maybeSingle()
    : { data: null };
  if (applicant) redirect("/dashboard/recruiting");
  // Signed up as a creator but never finished the profile wizard.
  if (user?.user_metadata?.first_name) redirect("/dashboard/recruiting/profile-setup");
  redirect("/dashboard");
}
