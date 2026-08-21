import { createClient } from "@/lib/supabase/server";

/**
 * Real accounts backed by Supabase Auth (see supabase/migrations/) —
 * a session is a real signed GoTrue JWT in cookies managed entirely by
 * @supabase/ssr, not an app-chosen cookie value. Route protection is
 * enforced in `proxy.ts` (not just hidden in the UI), and the "paid"
 * gate on course access lives on the `profiles` row, set only by
 * confirmed payment webhooks — see lib/profiles.ts.
 */

/**
 * Server-only — reads the real Supabase session and joins the matching
 * `profiles` row for display/course-progress info. Returns null if not
 * signed in.
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, paid")
    .eq("user_id", user.id)
    .maybeSingle();

  const email = user.email;
  const namePart = email.split("@")[0] ?? "student";
  const displayName =
    profile?.display_name ??
    namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, " ");
  const initials = namePart.slice(0, 2).toUpperCase();

  return {
    email,
    displayName,
    initials,
    emailVerified: user.email_confirmed_at != null,
    paid: profile?.paid ?? false,
  };
}
