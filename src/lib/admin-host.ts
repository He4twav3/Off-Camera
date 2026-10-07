/**
 * Serve the admin panel on its own address, and nowhere else.
 *
 * Set ADMIN_HOST (for example admin.example.com) in the PRODUCTION environment
 * and the site splits in two:
 *
 *   - On any other address, /admin simply does not exist (404).
 *   - On the admin address only admin, sign-in and password-reset pages exist.
 *     Everything else (the landing page, creator and brand areas, the API) is a
 *     404, and "/" goes to /admin.
 *
 * The admin address is meant to sit behind Cloudflare Access. Access only
 * protects traffic that goes THROUGH Cloudflare, and anyone can send a request
 * for the admin address straight to Vercel instead. So Cloudflare adds a secret
 * header (a Transform Rule) and the site refuses the admin address without it:
 *
 *   ADMIN_EDGE_SECRET   the secret; the same value is set in Cloudflare
 *
 * If ADMIN_HOST is set but ADMIN_EDGE_SECRET is not, the admin address serves
 * nothing. That fails closed on purpose. To switch it all off, remove ADMIN_HOST.
 *
 * Leave ADMIN_HOST unset on staging and previews: admin stays at /admin there.
 */
export const EDGE_HEADER = "x-oncamera-edge";

export type HostDecision =
  | { action: "allow" }
  | { action: "notfound" }
  | { action: "redirect"; to: string };

// Pages that exist on the admin address.
const ADMIN_ADDRESS_PATHS = [
  /^\/admin(\/|$)/,
  /^\/login$/,
  /^\/auth\//,
  /^\/forgot-password$/,
  /^\/reset-password$/,
  /^\/robots\.txt$/,
];

function normaliseHost(host: string | null | undefined): string {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "");
}

/** Compares without stopping at the first difference. */
function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminHostDecision(input: {
  host: string | null;
  path: string;
  adminHost: string | undefined;
  edgeHeader: string | null;
  edgeSecret: string | undefined;
}): HostDecision {
  const adminHost = normaliseHost(input.adminHost);
  if (!adminHost) return { action: "allow" };

  const onAdminAddress = normaliseHost(input.host) === adminHost;
  const path = input.path;

  if (!onAdminAddress) {
    return path === "/admin" || path.startsWith("/admin/") ? { action: "notfound" } : { action: "allow" };
  }

  // The admin address, but not through Cloudflare (or not configured): nothing here.
  const secret = input.edgeSecret ?? "";
  if (!secret || !sameSecret(input.edgeHeader ?? "", secret)) return { action: "notfound" };

  if (path === "/") return { action: "redirect", to: "/admin" };
  return ADMIN_ADDRESS_PATHS.some((re) => re.test(path)) ? { action: "allow" } : { action: "notfound" };
}
