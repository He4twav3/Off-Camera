/**
 * Real per-account lesson progress. Backed by the `profiles` table (see
 * lib/profiles.ts): completed lessons live on the account record in
 * Supabase, keyed by user, not just this browser — log in with the same
 * account on a different device and the same progress is there. A fresh
 * account has completed nothing, so every figure on the dashboard
 * genuinely reads 0 until a lesson is actually marked complete.
 */
import { CURRICULUM, TOTAL_LESSONS, TOTAL_MODULES } from "@/lib/curriculum";
import { getSession } from "@/lib/auth";
import { getUser } from "@/lib/profiles";

async function getCompletedLessonIds(): Promise<Set<string>> {
  const session = await getSession();
  if (!session) return new Set();
  const user = await getUser(session.email);
  return new Set(user?.completed_lessons ?? []);
}

export function formatMinutes(total: number): string {
  if (total <= 0) return "0m";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Everything the dashboard needs, computed fresh from the completed-lesson
 * set: per-module done/total, overall totals, minutes invested, and the
 * next lesson to show in "Continue learning" (the first incomplete one,
 * in course order — undefined once every lesson is done).
 */
export async function getDashboardProgress() {
  const completed = await getCompletedLessonIds();

  const modules = CURRICULUM.map((mod) => ({
    id: mod.id,
    title: mod.title,
    practice: mod.practice,
    lessons: mod.lessons.map((lesson) => ({
      ...lesson,
      done: completed.has(lesson.id),
    })),
    done: mod.lessons.filter((l) => completed.has(l.id)).length,
    total: mod.lessons.length,
  }));

  const completedLessons = modules.reduce((sum, m) => sum + m.done, 0);
  const completedModules = modules.filter((m) => m.done === m.total).length;
  const minutesInvested = modules
    .flatMap((m) => m.lessons)
    .filter((l) => l.done)
    .reduce((sum, l) => sum + l.minutes, 0);
  const percent =
    TOTAL_LESSONS === 0 ? 0 : Math.round((completedLessons / TOTAL_LESSONS) * 100);

  let nextLesson:
    | {
        moduleTitle: string;
        moduleIndex: number;
        lessonIndex: number;
        name: string;
        duration: string;
        id: string;
        youtubeId: string | undefined;
      }
    | undefined;
  outer: for (const [mi, mod] of modules.entries()) {
    for (const [li, lesson] of mod.lessons.entries()) {
      if (!lesson.done) {
        nextLesson = {
          moduleTitle: mod.title,
          moduleIndex: mi,
          lessonIndex: li,
          name: lesson.name,
          duration: lesson.duration,
          id: lesson.id,
          youtubeId: CURRICULUM[mi]?.youtubeId,
        };
        break outer;
      }
    }
  }

  return {
    modules,
    completedLessons,
    totalLessons: TOTAL_LESSONS,
    completedModules,
    totalModules: TOTAL_MODULES,
    minutesInvested,
    percent,
    nextLesson,
    isComplete: completedLessons === TOTAL_LESSONS,
  };
}
