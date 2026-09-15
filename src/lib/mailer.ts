import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import type { ReactElement } from "react";
import { Resend } from "resend";

/**
 * Real outbound email via Resend when RESEND_API_KEY is set (see
 * .env.local — never committed, see .gitignore). Every send is also
 * appended to a local outbox file regardless, same as leads.ts's
 * approach to captured emails — a real, inspectable record that a "send"
 * happened, independent of whether the API call itself succeeded. The
 * outbox only ever stores the plain-text fallback, not the rendered
 * HTML — it's an audit log, not a preview tool.
 *
 * The rich version (see emails/) is a real React component tree, in the
 * site's own colors resolved to plain hex — email clients don't
 * understand oklch()/CSS custom properties at all. Resend's SDK renders
 * it server-side itself (the `react` field below), no manual render()
 * step needed.
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
 *
 * The outbox write itself is best-effort, wrapped in its own try/catch
 * below (see writeOutbox) — Vercel's serverless functions run on a
 * read-only filesystem outside /tmp, so `mkdir(process.cwd() + "/data")`
 * throws ENOENT on every single invocation in production, unconditionally
 * killing the real send that follows it. This was live and silently
 * breaking every signup/purchase/password-reset email on Vercel: the
 * local debug log crashing the actual thing it was only ever meant to be
 * a convenience on top of. Local dev (a real, writable cwd) is unaffected
 * either way.
 */
const OUTBOX_FILE = path.join(process.cwd(), "data", "outbox.jsonl");

/** Best-effort only — see this file's header note on why. Never lets a
 * filesystem failure (read-only in production, permissions, anything)
 * take down the actual email send happening around it. */
async function writeOutbox(line: string) {
  try {
    await mkdir(path.dirname(OUTBOX_FILE), { recursive: true });
    await appendFile(OUTBOX_FILE, line + "\n", "utf8");
  } catch (err) {
    console.warn("mailer: could not write local outbox log (non-fatal):", err);
  }
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM ?? "On Camera <onboarding@resend.dev>";

export async function sendEmail(message: {
  to: string;
  subject: string;
  react: ReactElement;
  /** Plain-text fallback — required by real email best practice (some
   * clients/previews use it) and by the local outbox log, which never
   * stores the rendered HTML. */
  text: string;
}) {
  let delivery: "sent" | "outbox-only" | "failed" = "outbox-only";
  let deliveryError: string | undefined;

  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: message.to,
        subject: message.subject,
        react: message.react,
        text: message.text,
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

  await writeOutbox(
    JSON.stringify({
      to: message.to,
      subject: message.subject,
      bodyText: message.text,
      sentAt: new Date().toISOString(),
      delivery,
      ...(deliveryError && { deliveryError }),
    })
  );

  return { delivery };
}
