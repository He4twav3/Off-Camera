/**
 * Whether new creator and brand accounts can be created on the site.
 *
 * Closed unless SIGNUPS_OPEN is exactly "on", so forgetting to set it can
 * never leave sign-up open by accident. This only affects creating accounts:
 * people who already have one can still log in, and the private /team page
 * has its own key (TEAM_SIGNUP_KEY).
 *
 * Checked on the server in every sign-up step (create, resend code, verify
 * code), not only on the pages, so the form can't be bypassed by posting to it
 * directly.
 */
export function signupsOpen(): boolean {
  return process.env.SIGNUPS_OPEN === "on";
}

export const SIGNUPS_CLOSED_MESSAGE =
  "We're not taking new sign-ups right now. If you already have an account, sign in.";
