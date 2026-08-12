import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

/**
 * Real outbound "email" for this demo build: no ESP/SMTP provider is
 * configured (no Resend/Postmark/SES key anywhere), so there's nowhere to
 * actually deliver a password-reset or verify-email link. Two things
 * happen instead, same honesty-about-the-boundary approach as leads.ts:
 *
 * 1. The message is appended to a local outbox file — a real, inspectable
 *    record that a "send" happened, same as a real provider's dashboard
 *    would show.
 * 2. The caller (forgot-password/verify-email actions) shows the actual
 *    link directly in the response instead of just saying "check your
 *    email" — there's no inbox to check. This is clearly labeled in the
 *    UI as the dev/demo stand-in for real delivery, not hidden.
 *
 * Swap `sendEmail`'s body for a real API call before going live; nothing
 * else (token generation, expiry, hashing) needs to change — those parts
 * are already real, this is only the delivery boundary.
 */
const OUTBOX_FILE = path.join(process.cwd(), "data", "outbox.jsonl");

export async function sendEmail(message: {
  to: string;
  subject: string;
  bodyText: string;
}) {
  await mkdir(path.dirname(OUTBOX_FILE), { recursive: true });
  const line = JSON.stringify({ ...message, sentAt: new Date().toISOString() });
  await appendFile(OUTBOX_FILE, line + "\n", "utf8");
}
