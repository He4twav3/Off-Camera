/**
 * When a creator who signed up but hasn't connected an account gets each setup reminder. Pure, so the tests check
 * it. Three reminders at most, then it stops for good:
 *   1st: a day after signing up
 *   2nd: two days after the 1st
 *   3rd: four days after the 2nd
 * Never more than three automatic emails in 30 days, and only for signups from the last 90 days, so old accounts
 * aren't suddenly emailed. Based on onboarding-series research (three emails over about a week works; four or more
 * in a month makes most people unsubscribe).
 */
const DAY = 86_400_000;
export const REMINDER_GAPS_DAYS = [1, 2, 4];
export const MAX_IN_30_DAYS = 3;
export const SIGNUP_WINDOW_DAYS = 90;

export function dueReminder(signedUpAt: Date, sent: Date[], now: Date): number | null {
  if (now.getTime() - signedUpAt.getTime() > SIGNUP_WINDOW_DAYS * DAY) return null;
  if (sent.length >= REMINDER_GAPS_DAYS.length) return null;
  if (sent.filter((d) => now.getTime() - d.getTime() < 30 * DAY).length >= MAX_IN_30_DAYS) return null;
  const from = sent.length ? Math.max(...sent.map((d) => d.getTime())) : signedUpAt.getTime();
  return now.getTime() - from >= REMINDER_GAPS_DAYS[sent.length] * DAY ? sent.length : null;
}
