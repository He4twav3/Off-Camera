import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/mailer";
import { CodeEmail } from "@/emails/code-email";

/**
 * Email verification codes — the "second factor" for a new account.
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

export function codeFor(email: string, bucket: number): string {
  const mac = createHmac("sha256", key()).update(`${email.toLowerCase()}|${bucket}`).digest();
  return String(mac.readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function currentCode(email: string, now = Date.now()) {
  return codeFor(email, Math.floor(now / BUCKET_MS));
}

export function codeIsValid(email: string, input: string, now = Date.now()): boolean {
  if (!/^\d{6}$/.test(input)) return false;
  const bucket = Math.floor(now / BUCKET_MS);
  return [bucket, bucket - 1].some((b) => {
    const expected = Buffer.from(codeFor(email, b));
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

type Meta = { otp_attempts?: number; otp_locked_until?: number; otp_sent_at?: number };

async function loadUser(email: string) {
  const id = await findUserId(email);
  if (!id) return null;
  const { data } = await createAdminClient().auth.admin.getUserById(id);
  return data.user ?? null;
}

/** Emails the current code. Returns false if throttled or the user is gone. */
export async function sendVerificationCode(email: string): Promise<{ ok: boolean; throttled?: boolean }> {
  const user = await loadUser(email);
  if (!user || user.email_confirmed_at) return { ok: false };

  const meta = (user.user_metadata ?? {}) as Meta;
  if (meta.otp_sent_at && Date.now() - meta.otp_sent_at < RESEND_MS) {
    return { ok: false, throttled: true };
  }

  const code = currentCode(email);
  await sendEmail({
    to: email,
    subject: `${code} is your On Camera code`,
    react: CodeEmail({ code }),
    text: `Your On Camera verification code is ${code}. It expires in 10 minutes.`,
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
export async function verifyCode(email: string, input: string): Promise<VerifyResult> {
  const user = await loadUser(email);
  if (!user || user.email_confirmed_at) {
    return { ok: false, error: "That code didn't work. Request a new one." };
  }

  const admin = createAdminClient();
  const meta = (user.user_metadata ?? {}) as Meta;
  if (meta.otp_locked_until && meta.otp_locked_until > Date.now()) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  }

  if (!codeIsValid(email, input.trim())) {
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
