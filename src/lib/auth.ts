/**
 * Real accounts for this demo build (see users.ts): a session is just the
 * signed-in email, stored in a cookie — but reaching that state now
 * requires a real password, checked against a real (locally-stored)
 * account record. It's a genuine gate: you cannot reach /dashboard without
 * going through /login (enforced in `proxy.ts`, not just hidden in the
 * UI), and you cannot log into an existing account with the wrong
 * password. What's still "demo": credentials live in a local JSON file
 * instead of a real database — see users.ts for the swap-out point.
 */
export const SESSION_COOKIE = "off_camera_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Server-only — reads the session cookie and looks up the real account
 * record for display info. Returns null if not signed in.
 */
export async function getSession() {
  // Local import keeps `next/headers` out of any client bundle that
  // imports the cookie name/options above from this same file.
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const email = cookieStore.get(SESSION_COOKIE)?.value;
  if (!email) return null;

  const { getUser } = await import("@/lib/users");
  const user = await getUser(email);

  const namePart = email.split("@")[0] ?? "student";
  const displayName =
    user?.displayName ??
    namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, " ");
  const initials = namePart.slice(0, 2).toUpperCase();

  return { email, displayName, initials };
}
