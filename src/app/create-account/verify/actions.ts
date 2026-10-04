"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendVerificationCode, verifyCode } from "@/lib/email-code";
import { createBrandAccount } from "@/lib/brand-signup";

export type VerifyState = { error?: string; message?: string };

/**
 * Step 2: check the emailed code, confirm the account, and sign the person in
 * with a one-time session minted server-side (no password needed here — the
 * code itself was the proof). Creates the creator profile and lands on their
 * dashboard, which greets them by name.
 */
export async function verifyAccount(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").replace(/\s+/g, "");
  if (!email) return { error: "Start again from the sign-up page." };

  const result = await verifyCode(email, code);
  if (!result.ok) return { error: result.error };

  // A brand signup becomes a brand account (pending approval) and lands on /brand.
  const { data: signedUp } = await createAdminClient().auth.admin.getUserById(result.userId);
  const isBrand = signedUp.user?.user_metadata?.account_type === "brand";
  if (isBrand) await createBrandAccount(result.userId);

  const { data, error } = await createAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error("verifyAccount: could not mint session:", error?.message);
    return { error: "You're verified — sign in with your email and password." };
  }

  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (otpError) {
    console.error("verifyAccount: verifyOtp failed:", otpError.message);
    return { error: "You're verified — sign in with your email and password." };
  }

  redirect(isBrand ? "/brand" : "/dashboard/recruiting/profile-setup");
}

export async function resendCode(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Start again from the sign-up page." };
  const sent = await sendVerificationCode(email);
  if (sent.throttled) return { message: "Wait a few seconds, then try again." };
  return sent.ok ? { message: "New code sent." } : { error: "Couldn't send a code for that email." };
}
