"use server";

import { revalidatePath } from "next/cache";
import { ALL_LESSON_IDS } from "@/lib/curriculum";
import { getSession } from "@/lib/auth";
import {
  getUser,
  setLessonCompletion,
  resetUserProgress,
  changePassword,
  createVerificationToken,
} from "@/lib/users";
import { sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/request-url";

const VALID_IDS = new Set(ALL_LESSON_IDS);

/** Toggles one lesson's completion state on the signed-in account. */
export async function toggleLesson(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!VALID_IDS.has(lessonId)) return;

  const session = await getSession();
  if (!session) return;

  // Read-then-write is fine here — setLessonCompletion serializes writes
  // internally (see users.ts), so this can't race with itself.
  const user = await getUser(session.email);
  const alreadyDone = user?.completedLessons.includes(lessonId) ?? false;
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

export type ResendVerificationState = { error?: string; sent?: boolean; devLink?: string };

/** Issues a fresh verify-email token and "sends" it (see mailer.ts). */
export async function resendVerificationAction(
  _prevState: ResendVerificationState,
  _formData: FormData
): Promise<ResendVerificationState> {
  const session = await getSession();
  if (!session) return { error: "You're not signed in." };

  const result = await createVerificationToken(session.email);
  if (!result.ok) return { error: result.error };

  const baseUrl = await getBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(session.email)}&token=${result.token}`;
  await sendEmail({
    to: session.email,
    subject: "Verify your email — Off Camera",
    bodyText: `Verify your email:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });

  revalidatePath("/dashboard/account");
  return { sent: true, devLink: verifyUrl };
}
