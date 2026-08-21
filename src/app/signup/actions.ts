"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/request-url";

export type SignupState = { error?: string };

/**
 * Creates a new account only — rejects if the email is already taken
 * (unlike the old combined login form, this never silently signs someone
 * into an existing account). See login/actions.ts for the sign-in-only
 * counterpart.
 *
 * Confirmation email is sent by Supabase Auth itself now, not our own
 * Resend template (its wording/branding is customizable in the Supabase
 * dashboard under Authentication -> Email Templates) — matches how
 * CreatorRoster's own signup already worked before this merge. Whether
 * this returns an active session immediately or requires clicking that
 * email first depends on the project's "Confirm email" setting (on by
 * default), which is why the redirect branches on `data.session`.
 */
export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
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

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${baseUrl}/auth/callback?next=/dashboard` },
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("already registered")
        ? "An account with this email already exists."
        : error.message,
    };
  }

  redirect(data.session ? "/dashboard" : "/verify-email");
}
