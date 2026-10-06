"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerificationCode } from "@/lib/email-code";
import { clientIp, rateLimit, TOO_MANY } from "@/lib/rate-limit";
import { checkTeamPassword, keyMatches, teamSignupOpen } from "@/lib/team-signup";
import { TEAM_COOKIE } from "./constants";

export type TeamState = { error?: string };

/**
 * Team sign-up, separate from the creator and brand one. Four things must hold
 * before an account is made: the team access key is right, the email is on the
 * admin list, the password is strong, and (later) the code reaches the inbox.
 *
 * Once the key is right, the reply is the same whether or not the email is on
 * the admin list, so the list can't be probed from this page.
 */
export async function createTeamAccount(_prev: TeamState, formData: FormData): Promise<TeamState> {
  if (!teamSignupOpen(process.env.TEAM_SIGNUP_KEY)) return { error: "Team sign-up is closed." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const key = String(formData.get("key") ?? "");

  // Tight limits: this page should be used a handful of times, ever.
  if (!rateLimit(`team:ip:${await clientIp()}`, 6, 60 * 60_000) || !rateLimit(`team:email:${email}`, 3, 60 * 60_000)) {
    return { error: TOO_MANY };
  }

  if (!keyMatches(key, process.env.TEAM_SIGNUP_KEY)) return { error: "That team access key isn't right." };
  if (!email || !email.includes("@") || email.length > 200) return { error: "Enter a valid email address." };
  const weak = checkTeamPassword(password, email);
  if (weak) return { error: weak };

  const admin = createAdminClient();
  const nonce = randomBytes(16).toString("hex");

  const { data: listed } = await admin.from("admin_emails").select("email").eq("email", email).maybeSingle();
  if (listed) {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { account_type: "admin", otp_nonce: nonce },
    });
    if (error) {
      // Already registered: only an account that was never confirmed can be taken over,
      // and only by someone who then proves they own the inbox.
      const { data: profile } = await admin.from("profiles").select("user_id").eq("email", email).maybeSingle();
      const existing = profile ? (await admin.auth.admin.getUserById(profile.user_id)).data.user : null;
      if (existing && !existing.email_confirmed_at) {
        await admin.auth.admin.updateUserById(existing.id, {
          password,
          user_metadata: { ...existing.user_metadata, account_type: "admin", otp_nonce: nonce },
        });
      }
    }
    await sendVerificationCode(email, nonce);
  }

  (await cookies()).set(TEAM_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/team",
    maxAge: 60 * 30,
  });
  redirect(`/team/verify?email=${encodeURIComponent(email)}`);
}
