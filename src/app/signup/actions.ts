"use server";

import { ensureUser } from "@/lib/profiles";
import { sendEmail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/request-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { WelcomeFreeEmail } from "@/emails/welcome-free-email";

export type SaveSpotState = { error?: string; sent?: boolean };

/**
 * Free-access signup — creates (or reuses) a real, passwordless Supabase
 * Auth account via ensureUser (the same helper the paid-purchase flow
 * uses in lib/fulfillment.ts), then emails a magic sign-in link. Doesn't
 * touch `profiles.paid` at all — access while the course is free comes
 * from auth.ts's COURSE_IS_FREE override, not from this account looking
 * "paid." That keeps the real payment/paid signal untouched for later,
 * see auth.ts's own note.
 *
 * Wrapped in one try/catch: ensureUser throws (not returns an error) on
 * a real failure — a visitor hitting a raw unhandled exception here would
 * mean a 500 page and an internal error message leaking to the browser,
 * not the graceful `{error}` state the form is built to show.
 */
export async function saveSpot(
  _prevState: SaveSpotState,
  formData: FormData
): Promise<SaveSpotState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  try {
    await ensureUser(email);

    const baseUrl = await getBaseUrl();
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      // /auth/confirm, not /auth/callback — generateLink() always
      // produces an implicit-flow (hash-fragment) link, which needs the
      // client-side handler, not the PKCE-only server route. See
      // fulfillment.ts and auth/confirm/page.tsx's own notes on the
      // same thing.
      options: { redirectTo: `${baseUrl}/auth/confirm?next=/dashboard` },
    });

    if (error || !data.properties?.action_link) {
      console.error("saveSpot: could not generate sign-in link:", error);
      return { error: "Something went wrong. Try again in a moment." };
    }

    await sendEmail({
      to: email,
      subject: "You're in — On Camera",
      react: WelcomeFreeEmail({ claimUrl: data.properties.action_link }),
      text: `You're in! Sign in and start the course:\n\n${data.properties.action_link}\n\nThis link expires in 24 hours.`,
    });

    return { sent: true };
  } catch (err) {
    console.error("saveSpot: unexpected failure:", err);
    return { error: "Something went wrong. Try again in a moment." };
  }
}
