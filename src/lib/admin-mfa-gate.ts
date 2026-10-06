/**
 * Every admin page needs a session that passed two-step verification (aal2),
 * except the page where an admin sets it up or enters their code, so nobody can
 * get locked out of setting it up.
 *
 * Emergency switch: setting ADMIN_REQUIRE_MFA=off in the server environment
 * turns this page-level gate off (for example if Supabase's multi-factor setting
 * is misconfigured and nobody can enrol). Money actions stay protected in the
 * database either way.
 */
const EXEMPT = ["/admin/security"];

export function adminNeedsMfa(
  path: string,
  level: string | null | undefined,
  switchValue: string | undefined,
): boolean {
  if (switchValue === "off") return false;
  if (path !== "/admin" && !path.startsWith("/admin/")) return false;
  if (EXEMPT.some((p) => path === p || path.startsWith(`${p}/`))) return false;
  return level !== "aal2";
}
