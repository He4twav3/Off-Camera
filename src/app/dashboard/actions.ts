"use server";

import { revalidatePath } from "next/cache";
import { ALL_LESSON_IDS } from "@/lib/curriculum";
import { getSession } from "@/lib/auth";
import { getUser, setLessonCompletion, resetUserProgress, changePassword } from "@/lib/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/request-url";
import { sendEmail } from "@/lib/mailer";
import { VerifyEmailEmail } from "@/emails/verify-email";

const VALID_IDS = new Set(ALL_LESSON_IDS);

/** Toggles one lesson's completion state on the signed-in account. */
export async function toggleLesson(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!VALID_IDS.has(lessonId)) return;

  const session = await getSession();
  if (!session) return;

  const user = await getUser(session.email);
  // Real gate, not just the dashboard UI hiding the button: an unpaid
  // account calling this action directly still can't mark lessons done.
  if (!user?.paid) return;
  const alreadyDone = user.completed_lessons.includes(lessonId);
  await setLessonCompletion(session.email, lessonId, !alreadyDone);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/account");
}

/** Clears all progress for the signed-in account. Real and reversible only by redoing the work. */
export async function resetProgress() {
  const session = await getSession();
  if (!session) return;
  await resetUserProgress(session.email);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/account");
}

export type ChangePasswordState = { error?: string; success?: boolean };

/** Requires the current password — not just being signed in — same as any real "change password" form. */
export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) return { error: "You're not signed in." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords don't match." };
  }

  const result = await changePassword(session.email, currentPassword, newPassword);
  if (!result.ok) return { error: result.error };

  return { success: true };
}

export type ResendVerificationState = { error?: string; sent?: boolean };

/** Resends the verification email through our own dark template: a
 * magic link, which confirms the address when it's opened. */
export async function resendVerificationAction(
  _prevState: ResendVerificationState,
  _formData: FormData
): Promise<ResendVerificationState> {
  const session = await getSession();
  if (!session) return { error: "You're not signed in." };

  const baseUrl = await getBaseUrl();
  const { data, error } = await createAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email: session.email,
    options: { redirectTo: `${baseUrl}/auth/confirm?next=/dashboard` },
  });
  if (error || !data.properties?.action_link) return { error: "Couldn't send the email. Try again." };

  await sendEmail({
    to: session.email,
    subject: "Verify your email — On Camera",
    react: VerifyEmailEmail({ verifyUrl: data.properties.action_link }),
    text: `Verify your On Camera email:\n\n${data.properties.action_link}\n\nThis link expires in 24 hours.`,
  });

  revalidatePath("/dashboard/account");
  return { sent: true };
}
