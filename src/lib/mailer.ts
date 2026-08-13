import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";

/**
 * Real outbound email via Resend when RESEND_API_KEY is set (see
 * .env.local — never committed, see .gitignore). Every send is also
 * appended to a local outbox file regardless, same as leads.ts's
 * approach to captured emails — a real, inspectable record that a "send"
 * happened, independent of whether the API call itself succeeds.
 *
 * Without a real domain verified on the Resend account, mail can only
 * go out from the shared `onboarding@resend.dev` sender, and Resend will
 * only actually deliver it to the email address the Resend account
 * itself was signed up with — fine while it's just the account owner
 * testing, not yet for real students until a domain is verified there
 * (swap RESEND_FROM once that's done).
 *
 * If RESEND_API_KEY isn't set at all, this silently falls back to
 * outbox-only (the original demo behavior) instead of throwing — so the
 * app still runs for anyone who clones this without setting up email.
 */
const OUTBOX_FILE = path.join(process.cwd(), "data", "outbox.jsonl");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM ?? "Off Camera <onboarding@resend.dev>";

export async function sendEmail(message: {
  to: string;
  subject: string;
  bodyText: string;
}) {
  await mkdir(path.dirname(OUTBOX_FILE), { recursive: true });

  let delivery: "sent" | "outbox-only" | "failed" = "outbox-only";
  let deliveryError: string | undefined;

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: message.to,
        subject: message.subject,
        text: message.bodyText,
      });
      if (result.error) {
        delivery = "failed";
        deliveryError = result.error.message;
        console.error("Resend send failed:", result.error);
      } else {
        delivery = "sent";
      }
    } catch (err) {
      delivery = "failed";
      deliveryError = err instanceof Error ? err.message : String(err);
      console.error("Resend send threw:", err);
    }
  }

  const line = JSON.stringify({
    ...message,
    sentAt: new Date().toISOString(),
    delivery,
    ...(deliveryError && { deliveryError }),
  });
  await appendFile(OUTBOX_FILE, line + "\n", "utf8");

  return { delivery };
}
