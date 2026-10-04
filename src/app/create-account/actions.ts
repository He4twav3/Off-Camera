"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerificationCode } from "@/lib/email-code";
import { parseCreatorSignup, signupMetadata } from "@/lib/creator-signup";

export type CreateAccountState = { error?: string };

/**
 * Step 1 of signup: name, email, handles and password. The account is created UNCONFIRMED and
 * a 6-digit code is emailed (see lib/email-code.ts); it can't be used until
 * the code is entered on /create-account/verify, which confirms it and signs
 * the person in.
 *
 * An existing but still-unconfirmed account (someone who never entered their
 * code) is re-used: its password is replaced with the one just submitted and a
 * fresh code is sent — safe, because the account only becomes usable after the
 * code reaches that inbox. An already-confirmed account is told to sign in.
 */
export async function createAccount(
  _prev: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const parsed = parseCreatorSignup(formData);
  if (!parsed.ok) return { error: parsed.error };
  const metadata = signupMetadata(parsed.value);

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Use a password of at least 8 characters." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: metadata,
  });

  if (error) {
    // Already registered: reuse it only if it never got confirmed.
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    const existing = profile
      ? (await admin.auth.admin.getUserById(profile.user_id)).data.user
      : null;
    if (!existing) {
      console.error("createAccount failed:", error.message);
      return { error: "Couldn't create the account. Try again in a moment." };
    }
    if (existing.email_confirmed_at) {
      return { error: "That email already has an account. Sign in instead." };
    }
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { ...existing.user_metadata, ...metadata },
    });
  }

  const sent = await sendVerificationCode(email);
  if (!sent.ok && !sent.throttled) {
    return { error: "Couldn't send the code. Try again in a moment." };
  }

  redirect(`/create-account/verify?email=${encodeURIComponent(email)}`);
}
