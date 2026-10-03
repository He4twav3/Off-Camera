"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/request-url";

export type CreateAccountState = { error?: string };

/**
 * Email + password signup using Supabase's own signUp — the project's email
 * confirmation setting decides what happens next: if confirmation is off we
 * get a session back and go straight to the dashboard; if it's on, Supabase
 * emails a confirmation link (PKCE, handled by /auth/callback) and we send
 * the person to /verify-email. Existing emails get the same response either
 * way, so this can't be used to probe which addresses have accounts.
 */
export async function createAccount(
  _prev: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Use a password of at least 8 characters." };
  }

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${baseUrl}/auth/callback?next=/dashboard` },
  });

  if (error) {
    console.error("createAccount failed:", error.message);
    return { error: "Couldn't create the account. Try again in a moment." };
  }

  redirect(data.session ? "/dashboard" : "/verify-email");
}
