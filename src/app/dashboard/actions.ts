"use server";

import { revalidatePath } from "next/cache";
import { ALL_LESSON_IDS } from "@/lib/curriculum";
import { getSession } from "@/lib/auth";
import { getUser, setLessonCompletion, resetUserProgress } from "@/lib/users";

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
