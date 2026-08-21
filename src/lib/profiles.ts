import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/database.types";

/**
 * Real accounts, now backed by Supabase Auth + the `profiles` table
 * (see supabase/migrations/0006_off_camera_profiles.sql) instead of a
 * local JSON file. Password hashing/storage, rate-limiting, and
 * reset/verify tokens are all owned by Supabase Auth itself now —
 * createUser/verifyUser/requestPasswordReset/resetPasswordWithToken/
 * createVerificationToken/verifyEmailToken from the old users.ts are
 * gone outright, replaced by direct supabase.auth.* calls at each
 * action's call site (signUp, signInWithPassword, resetPasswordForEmail,
 * updateUser, resend).
 *
 * What's preserved here, with the same names/signatures the rest of the
 * app already depends on: paid-status management (still the real gate
 * on course access, still only settable from confirmed payment
 * fulfillment) and lesson-progress tracking.
 */

function deriveDisplayName(email: string): string {
  const namePart = email.split("@")[0] ?? "student";
  return namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, " ");
}

/** Looks up the signed-in user's own profile row. Uses the RLS-respecting
 * server client — safe because a user looking themselves up by their own
 * email always resolves to a row where `user_id = auth.uid()`, which is
 * exactly what the `profiles_select_own_or_admin` policy allows. */
export async function getUser(email: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return data;
}

/**
 * Creates the account if it doesn't exist yet, without requiring a
 * password. Only ever called from confirmed-payment fulfillment (see
 * fulfillment.ts) — never from client-submitted checkout form data
 * directly, since that would grant access without an actual charge
 * having happened.
 *
 * `email_confirm: true` — unlike an organic signup (which still goes
 * through Supabase's normal confirm-your-email flow), a payment
 * provider having accepted a real charge tied to this email is itself
 * a real trust signal; the separate "claim your account" magic-link
 * email (see fulfillment.ts) still exists to give a password-less way
 * in, since no password was ever set.
 */
export async function ensureUser(
  email: string
): Promise<{ userId: string; isNew: boolean }> {
  const key = email.toLowerCase();
  const admin = createAdminClient();

  const { data: created, error } = await admin.auth.admin.createUser({
    email: key,
    password: randomBytes(24).toString("hex"),
    email_confirm: true,
    user_metadata: { display_name: deriveDisplayName(key) },
  });

  if (!error && created.user) {
    return { userId: created.user.id, isNew: true };
  }

  // "already registered" — resolve the existing account instead. The
  // profiles.email index (0006) is the lookup path since the admin API
  // has no direct get-user-by-email call.
  const { data: existing } = await admin
    .from("profiles")
    .select("user_id")
    .eq("email", key)
    .maybeSingle();

  if (existing) return { userId: existing.user_id, isNew: false };

  // Genuinely unexpected — createUser failed for a reason other than
  // "already exists", and there's no existing profile to fall back to.
  throw new Error(`ensureUser: could not create or find account for ${key}: ${error?.message}`);
}

/**
 * Marks an account as paid — the one and only function allowed to flip
 * `paid` to true, and it's only ever called from confirmed-payment
 * fulfillment, never from anything a browser submits directly.
 * Idempotent: safe to call more than once for the same purchase (a
 * webhook can be delivered more than once by design, and the
 * confirm-redirect route and the webhook both call this for the same
 * payment as a belt-and-suspenders pair).
 */
export async function markUserPaid(
  email: string,
  provider: "dodo" | "nowpayments",
  reference: string
): Promise<{ ok: true; alreadyPaid: boolean } | { ok: false; error: string }> {
  const key = email.toLowerCase();
  const admin = createAdminClient();

  const { data: profile, error: lookupError } = await admin
    .from("profiles")
    .select("paid, paid_at, payment_provider, payment_reference")
    .eq("email", key)
    .maybeSingle();
  if (lookupError || !profile) return { ok: false, error: "Account not found." };

  const alreadyPaid = profile.paid;
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      paid: true,
      paid_at: profile.paid_at ?? new Date().toISOString(),
      payment_provider: profile.payment_provider ?? provider,
      payment_reference: profile.payment_reference ?? reference,
    })
    .eq("email", key);
  if (updateError) return { ok: false, error: updateError.message };

  return { ok: true, alreadyPaid };
}

/**
 * The refund counterpart to markUserPaid — only ever called from a
 * confirmed refund webhook, never from anything client-triggered. Flips
 * `paid` back to false so the dashboard re-locks immediately, but
 * deliberately leaves payment_provider/payment_reference alone — this
 * is a revocation, not an erasure of what happened.
 */
export async function revokeUserAccess(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { error, count } = await admin
    .from("profiles")
    .update({ paid: false, refunded_at: new Date().toISOString() }, { count: "exact" })
    .eq("email", email.toLowerCase());
  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Account not found." };
  return { ok: true };
}

/**
 * Changes the password for the signed-in user. Re-verifies the current
 * password for real via signInWithPassword (fails loudly if wrong)
 * rather than trusting that reaching this action at all is proof
 * enough — same "requires the current password, same as any real
 * change password form" standard the old implementation held itself to.
 */
export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (verifyError) return { ok: false, error: "Current password is incorrect." };

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) return { ok: false, error: updateError.message };

  return { ok: true };
}

export async function setLessonCompletion(email: string, lessonId: string, done: boolean) {
  const supabase = await createClient();
  const user = await getUser(email);
  if (!user) return;

  const set = new Set(user.completed_lessons);
  if (done) set.add(lessonId);
  else set.delete(lessonId);

  await supabase
    .from("profiles")
    .update({ completed_lessons: [...set] })
    .eq("email", email.toLowerCase());
}

export async function resetUserProgress(email: string) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ completed_lessons: [] }).eq("email", email.toLowerCase());
}
