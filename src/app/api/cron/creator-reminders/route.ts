import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/mailer";
import { siteConfig } from "@/lib/site-config";
import { SETUP_REMINDERS, SetupReminderEmail } from "@/emails/setup-reminder-email";
import { dueReminder } from "@/lib/reminder-schedule";
import { readReminderLog, readUnsubscribed, saveReminderLog, unsubscribeUrl } from "@/lib/email-reminders";

// Daily (see vercel.json): a setup reminder to each creator who signed up but hasn't connected an account, on the
// schedule in lib/reminder-schedule.ts. Stops as soon as they connect one, and never emails anyone who unsubscribed.
// Same CRON_SECRET guard as the other crons.
export const maxDuration = 60;

// Kept under the email service's daily allowance, with room for the site's own emails.
const MAX_PER_RUN = 60;
// The first reminders go no earlier than this: the MePersona announcement went out the day before.
const START = Date.UTC(2026, 9, 29);

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (Date.now() < START) return NextResponse.json({ sent: 0, waiting: "starts 2026-10-29" });

  const db = createAdminClient();
  const [{ data: creators }, { data: handles }, log, unsubscribed] = await Promise.all([
    db.from("applicants").select("id, name, email, created_at"),
    db.from("applicant_handles").select("applicant_id"),
    readReminderLog(),
    readUnsubscribed(),
  ]);
  const connected = new Set((handles ?? []).map((h) => h.applicant_id));
  const base = siteConfig.url.replace(/\/+$/, "");
  const now = new Date();
  const deadline = Date.now() + 50_000;
  let sent = 0;

  for (const c of creators ?? []) {
    if (sent >= MAX_PER_RUN || Date.now() > deadline) break;
    const email = (c.email ?? "").trim().toLowerCase();
    if (!email || email.endsWith("@no-email.local") || connected.has(c.id) || unsubscribed.has(email)) continue;
    const history = (log[email] ?? []).map((d) => new Date(d));
    const step = dueReminder(new Date(c.created_at), history, now);
    if (step === null) continue;
    const first = (c.name ?? "").trim().split(/\s+/)[0] || "there";
    const leave = unsubscribeUrl(base, email);
    const url = `${base}/dashboard/account/accounts`;
    const r = SETUP_REMINDERS[step];
    const { delivery } = await sendEmail({
      to: email,
      subject: r.subject,
      react: SetupReminderEmail({ step, name: first, url, unsubscribeUrl: leave }),
      text: [`Hi ${first},`, ...r.lines, `${r.button}: ${url}`, "The OnCamera team", `Unsubscribe: ${leave}`].join("\n\n"),
      headers: { "List-Unsubscribe": `<${leave}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (delivery !== "sent") continue;
    log[email] = [...(log[email] ?? []), now.toISOString()];
    sent++;
  }
  if (sent) await saveReminderLog(log);
  return NextResponse.json({ creators: creators?.length ?? 0, sent });
}
