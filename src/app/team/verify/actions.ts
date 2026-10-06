"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendVerificationCode, verifyCode } from "@/lib/email-code";
import { clientIp, rateLimit, TOO_MANY } from "@/lib/rate-limit";
import { TEAM_COOKIE } from "../constants";

export type TeamVerifyState = { error?: string; message?: string };

const GENERIC = "That code didn't work. Check it, or start again from the team sign-up page.";

/** The unconfirmed team account for this email, or null. Only admin-type accounts on the admin list qualify. */
async function teamAccount(email: string) {
  const admin = createAdminClient();
  const { data: listed } = await admin.from("admin_emails").select("email").eq("email", email).maybeSingle();
  if (!listed) return null;
  const { data: profile } = await admin.from("profiles").select("user_id").eq("email", email).maybeSingle();
  if (!profile) return null;
  const user = (await admin.auth.admin.getUserById(profile.user_id)).data.user;
  if (!user || user.user_metadata?.account_type !== "admin") return null;
  return user;
}

export async function verifyTeamAccount(_prev: TeamVerifyState, formData: FormData): Promise<TeamVerifyState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").replace(/\s+/g, "");
  if (!email) return { error: "Start again from the team sign-up page." };
  if (!rateLimit(`team:verify:${await clientIp()}`, 15, 10 * 60_000)) return { error: TOO_MANY };

  // Checked before the code, so a code can never confirm an account that isn't a team one.
  if (!(await teamAccount(email))) return { error: GENERIC };

  const nonce = (await cookies()).get(TEAM_COOKIE)?.value ?? "";
  const result = await verifyCode(email, nonce, code);
  if (!result.ok) return { error: result.error };

  // Sign the person in with a one-time session minted server-side; the emailed
  // code was the proof. They land on the page where they set up their authenticator.
  const { data, error } = await createAdminClient().auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) return { error: "You're verified. Sign in with your email and password." };

  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (otpError) return { error: "You're verified. Sign in with your email and password." };

  (await cookies()).delete(TEAM_COOKIE);
  redirect("/admin/security");
}

export async function resendTeamCode(_prev: TeamVerifyState, formData: FormData): Promise<TeamVerifyState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Start again from the team sign-up page." };
  if (!rateLimit(`team:resend:${await clientIp()}`, 5, 10 * 60_000)) return { error: TOO_MANY };
  if (!(await teamAccount(email))) return { message: "If that email is on the team list, a new code is on its way." };
  const nonce = (await cookies()).get(TEAM_COOKIE)?.value ?? "";
  const sent = await sendVerificationCode(email, nonce);
  if (sent.throttled) return { message: "Wait a few seconds, then try again." };
  return { message: "If that email is on the team list, a new code is on its way." };
}
