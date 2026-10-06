/**
 * Which copy of the site is this: the live one, a staging one, or a developer's
 * machine? Staging is a full copy of the site pointing at its own, separate
 * Supabase project, so changes can be tried on it before they go live.
 *
 * Set APP_ENV explicitly on every deployment:
 *   production   the live site
 *   staging      the test copy (Vercel "Preview" deployments)
 * Left unset, a production build counts as production and a local run as development.
 */
export type AppEnv = "production" | "staging" | "development";

export function appEnv(value: string | undefined = process.env.APP_ENV, nodeEnv: string | undefined = process.env.NODE_ENV): AppEnv {
  if (value === "staging" || value === "production" || value === "development") return value;
  return nodeEnv === "production" ? "production" : "development";
}

export const isStaging = () => appEnv() === "staging";

/**
 * Guards against the worst staging mistake: the test site holding the LIVE
 * database keys (or the live site holding test ones). When EXPECTED_SUPABASE_REF
 * (the project's short id, the first part of its URL) is set, the Supabase URL
 * must contain it, or database access is refused. Unset means no check, so
 * adding this can never break an existing deployment, but set it on both.
 */
export function supabaseMismatch(
  url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
  expectedRef: string | undefined = process.env.EXPECTED_SUPABASE_REF,
): string | null {
  const ref = (expectedRef ?? "").trim();
  if (!ref) return null;
  let host = "";
  try {
    host = new URL(url ?? "").hostname;
  } catch {
    return "NEXT_PUBLIC_SUPABASE_URL is missing or not a valid URL.";
  }
  // Exact match only: a longer look-alike host such as "<ref>.supabase.co.evil.com" must not pass.
  if (host !== `${ref}.supabase.co`) {
    return `This deployment expects Supabase project "${ref}" but is pointed at "${host}". Check the environment variables.`;
  }
  return null;
}

export function assertSupabaseEnvironment(): void {
  const problem = supabaseMismatch();
  if (problem) throw new Error(problem);
}

/**
 * Staging must never email real people. Only addresses on STAGING_EMAIL_ALLOWLIST
 * (comma-separated: exact emails, or "@domain.com" for a whole domain) get real
 * email; everything else is logged and skipped.
 */
export function stagingEmailAllowed(to: string, allowlist: string | undefined = process.env.STAGING_EMAIL_ALLOWLIST): boolean {
  const address = to.trim().toLowerCase();
  const entries = (allowlist ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return entries.some((e) => (e.startsWith("@") ? address.endsWith(e) : address === e));
}
