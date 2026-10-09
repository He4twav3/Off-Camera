/**
 * A hidden door to the admin panel. Without it, /admin is a plain 404 for everyone, so the
 * address isn't there to be guessed or found. You open the door once, by visiting the secret
 * address; that sets a cookie in your browser, and from then on /admin works in that browser
 * (the sign-in, the authenticator code and the admin list still all apply on top of it).
 *
 * The secret address is ADMIN_DOOR_PATH if that is set, otherwise the built-in one below. It is
 * only enforced on the live site (or wherever ADMIN_DOOR_PATH is set), so local work and staging
 * keep using /admin directly.
 *
 * Pure (no server imports) so it can be tested.
 */
export const DOOR_COOKIE = "oc_door";

/** Used on the live site when ADMIN_DOOR_PATH is not set. Change it by setting that variable. */
const BUILT_IN_DOOR = "/hq-onyx-falcon-meadow-4821";

export function doorPath(env: { ADMIN_DOOR_PATH?: string; VERCEL_ENV?: string }): string | null {
  const set = (env.ADMIN_DOOR_PATH ?? "").trim();
  if (set) return set.startsWith("/") ? set : `/${set}`;
  return env.VERCEL_ENV === "production" ? BUILT_IN_DOOR : null;
}

export type DoorDecision = "pass" | "open" | "block";

/** Lower case, with any dots, commas or slashes pasted on the end removed. */
function tidy(path: string): string {
  return path.toLowerCase().replace(/[.,;:!?)\]\s/]+$/, "");
}

export function doorDecision(input: { path: string; cookie: string | undefined; door: string | null }): DoorDecision {
  const { path, cookie, door } = input;
  if (!door) return "pass";
  if (tidy(path) === tidy(door)) return "open";
  const isAdmin = path === "/admin" || path.startsWith("/admin/");
  if (isAdmin && cookie !== door) return "block";
  return "pass";
}
