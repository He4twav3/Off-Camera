/** The setup reminders' schedule. Run: npx tsx scripts/test-reminder-schedule.ts */
import { dueReminder } from "../src/lib/reminder-schedule";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const day = (n: number) => new Date(Date.UTC(2026, 9, 1) + n * 86_400_000);

t("nothing on the day of signing up", dueReminder(day(0), [], day(0.5)) === null);
t("1st a day after signing up", dueReminder(day(0), [], day(1)) === 0);
t("2nd not before 2 days after the 1st", dueReminder(day(0), [day(1)], day(2.5)) === null);
t("2nd 2 days after the 1st", dueReminder(day(0), [day(1)], day(3)) === 1);
t("3rd 4 days after the 2nd", dueReminder(day(0), [day(1), day(3)], day(7)) === 2);
t("stops after 3", dueReminder(day(0), [day(1), day(3), day(7)], day(40)) === null);
t("an old signup isn't emailed", dueReminder(day(0), [], day(91)) === null);
t("an older signup still in the window starts at the 1st", dueReminder(day(0), [], day(30)) === 0);

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
