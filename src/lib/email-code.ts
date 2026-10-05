import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/mailer";
import { CodeEmail } from "@/emails/code-email";

/**
 * Email verification codes — the "second factor" for a new account.
 *
 * BOUND TO ONE SIGNUP ATTEMPT. Each signup stores a random `otp_nonce` on the
 * account (and in an httpOnly cookie in the signing-up browser), and the code is
 * derived from email + nonce + time. A later signup for the same address
 * replaces the nonce, so a code emailed for someone else's attempt can never
 * confirm this account, and the cookie must match before any code is checked.
 *
 * STATELESS CODES. The 6-digit code is HMAC(key, "email|time-bucket"), so no
 * table is needed: the server can recompute what it should have sent. A code
 * is accepted for the current and the previous 10-minute bucket (so it lives
 * 10–20 minutes). The HMAC key is derived from the service-role key, which
 * only the server has.
 *
 * ATTEMPT LIMITS + RESEND THROTTLE live on the Supabase user's own
 * `user_metadata` (written with the admin client): 5 wrong guesses locks
 * verification for 15 minutes, and a new code can't be sent more than once
 * every 30 seconds. Only unconfirmed accounts can be verified this way —
 * once confirmed, a code means nothing.
 */

const BUCKET_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const RESEND_MS = 30 * 1000;

function key() {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-only")
    .update("email-code-v1")
    .digest();
}

export function codeFor(email: string, nonce: string, bucket: number): string {
  const mac = createHmac("sha256", key()).update(`${email.toLowerCase()}|${nonce}|${bucket}`).digest();
  return String(mac.readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function currentCode(email: string, nonce: string, now = Date.now()) {
  return codeFor(email, nonce, Math.floor(now / BUCKET_MS));
}

export function codeIsValid(email: string, nonce: string, input: string, now = Date.now()): boolean {
  if (!/^\d{6}$/.test(input)) return false;
  const bucket = Math.floor(now / BUCKET_MS);
  return [bucket, bucket - 1].some((b) => {
    const expected = Buffer.from(codeFor(email, nonce, b));
    const given = Buffer.from(input);
    return expected.length === given.length && timingSafeEqual(expected, given);
  });
}

async function findUserId(email: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("user_id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return data?.user_id ?? null;
}

type Meta = { otp_attempts?: number; otp_locked_until?: number; otp_sent_at?: number; otp_nonce?: string };

async function loadUser(email: string) {
  const id = await findUserId(email);
  if (!id) return null;
  const { data } = await createAdminClient().auth.admin.getUserById(id);
  return data.user ?? null;
}

/** Emails the current code. Returns false if throttled or the user is gone. */
export async function sendVerificationCode(email: string, nonce: string): Promise<{ ok: boolean; throttled?: boolean }> {
  const user = await loadUser(email);
  if (!user || user.email_confirmed_at) return { ok: false };

  const meta = (user.user_metadata ?? {}) as Meta;
  // Only the signup attempt that currently owns the account may request codes.
  if (!nonce || meta.otp_nonce !== nonce) return { ok: false };
  if (meta.otp_sent_at && Date.now() - meta.otp_sent_at < RESEND_MS) {
    return { ok: false, throttled: true };
  }

  const code = currentCode(email, nonce);
  await sendEmail({
    to: email,
    subject: `${code} is your On Camera verification code`,
    react: CodeEmail({ code }),
    text: [
      "Verify your email address",
      "",
      `Use this verification code to finish creating your On Camera account: ${code}`,
      "This code expires in 10 minutes.",
      "",
      "If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake, and no account will be created without this code.",
      "",
      "For your security, never share this code with anyone. On Camera will never ask you for it, by email, phone or message.",
      "",
      "This is an automated message, so please don't reply to it.",
    ].join("\n"),
  });
  await createAdminClient().auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, otp_sent_at: Date.now() },
  });
  return { ok: true };
}

export type VerifyResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/** Checks a code for an unconfirmed account and, on success, confirms it. */
export async function verifyCode(email: string, nonce: string, input: string): Promise<VerifyResult> {
  const user = await loadUser(email);
  if (!user || user.email_confirmed_at) {
    return { ok: false, error: "That code didn't work. Request a new one." };
  }

  const admin = createAdminClient();
  const meta = (user.user_metadata ?? {}) as Meta;
  // The code must belong to THIS browser's signup attempt. If the address was
  // signed up again by someone else, the nonce changed and this is refused.
  if (!nonce || meta.otp_nonce !== nonce) {
    return { ok: false, error: "This sign-up was restarted. Please start again from the sign-up page." };
  }
  if (meta.otp_locked_until && meta.otp_locked_until > Date.now()) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  }

  if (!codeIsValid(email, nonce, input.trim())) {
    const attempts = (meta.otp_attempts ?? 0) + 1;
    const locked = attempts >= MAX_ATTEMPTS;
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        otp_attempts: locked ? 0 : attempts,
        otp_locked_until: locked ? Date.now() + LOCK_MS : undefined,
      },
    });
    return {
      ok: false,
      error: locked
        ? "Too many attempts. Try again in a few minutes."
        : "That code isn't right. Check it and try again.",
    };
  }

  await admin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
    user_metadata: { ...user.user_metadata, otp_attempts: 0, otp_locked_until: undefined },
  });
  return { ok: true, userId: user.id };
}
