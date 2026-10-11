/**
 * Environment-agnostic feature flags — safe to import from both server
 * and client components (unlike lib/auth.ts, which pulls in
 * @supabase/ssr's server-only client and can't be imported from
 * anything client-side).
 */

/**
 * TEMPORARY: the course is free to access for now. This is the single
 * on/off switch — lib/auth.ts reads it to bypass the `paid` gate, and
 * anything that assumed a bounded "free preview, then paywall" window
 * (the countdown badge) reads it too, since that framing stops being
 * true the moment access isn't actually time-limited. Flip back to
 * `false` (or delete the override in auth.ts) to re-enable paid
 * enrollment — nothing about the payment/webhook/DB architecture
 * changes underneath this.
 */
export const COURSE_IS_FREE = true;

/**
 * Whether the course is visible on the public site. OFF: the course is detached, and the only place it shows is a
 * "coming soon" page at /course (no curriculum, no price, no checkout, no mentions in the nav, footer, sitemap, About,
 * Terms, Privacy, Refund Policy or changelog). Nothing is deleted: every course page, lesson, checkout and payment
 * handler is still in the code, and setting this to `true` and pushing puts it all back.
 */
export const COURSE_PUBLIC = false;
