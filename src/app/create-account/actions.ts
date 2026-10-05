"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerificationCode } from "@/lib/email-code";
import { SIGNUP_COOKIE } from "./constants";
import { clientIp, rateLimit, TOO_MANY } from "@/lib/rate-limit";
import { parseCreatorSignup, signupMetadata } from "@/lib/creator-signup";
import { brandMetadata, parseBrandSignup } from "@/lib/brand-signup";

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

  // One form, two kinds of account: a brand (company side) or a creator.
  const isBrand = formData.get("account_type") === "brand";
  const parsed = isBrand ? parseBrandSignup(formData) : parseCreatorSignup(formData);
  if (!parsed.ok) return { error: parsed.error };
  const metadata = isBrand
    ? brandMetadata(parsed.value as Parameters<typeof brandMetadata>[0])
    : signupMetadata(parsed.value as Parameters<typeof signupMetadata>[0]);

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Use a password of at least 8 characters." };
  }

  // Each signup sends an email, so cap it per address and per visitor.
  if (
    !rateLimit(`signup:ip:${await clientIp()}`, 8, 10 * 60_000) ||
    !rateLimit(`signup:email:${email}`, 4, 60 * 60_000)
  ) {
    return { error: TOO_MANY };
  }

  // One random id per signup attempt: stored on the account and in this
  // browser only. See lib/email-code.ts.
  const nonce = randomBytes(16).toString("hex");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { ...metadata, otp_nonce: nonce },
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
      user_metadata: { ...existing.user_metadata, ...metadata, otp_nonce: nonce },
    });
  }

  const sent = await sendVerificationCode(email, nonce);
  if (!sent.ok && !sent.throttled) {
    return { error: "Couldn't send the code. Try again in a moment." };
  }

  (await cookies()).set(SIGNUP_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/create-account",
    maxAge: 60 * 30,
  });

  redirect(`/create-account/verify?email=${encodeURIComponent(email)}`);
}
