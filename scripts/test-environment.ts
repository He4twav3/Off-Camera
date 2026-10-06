/**
 * Tests the guards that keep staging separate from the live site
 * (src/lib/environment.ts). Run:  npx tsx scripts/test-environment.ts
 */
import { appEnv, stagingEmailAllowed, supabaseMismatch } from "../src/lib/environment";

// These tests must give the same answer on any machine, whatever settings it
// has (the automatic checks set APP_ENV=staging for the build), so start clean.
delete process.env.APP_ENV;
delete process.env.EXPECTED_SUPABASE_REF;
delete process.env.STAGING_EMAIL_ALLOWLIST;

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

// which environment is this
t("APP_ENV=staging wins", appEnv("staging", "production") === "staging");
t("APP_ENV=production wins", appEnv("production", "development") === "production");
t("unset in a production build counts as production", appEnv(undefined, "production") === "production");
t("unset on a developer's machine is development", appEnv(undefined, "development") === "development");
t("a typo in APP_ENV does not become staging", appEnv("stagin", "production") === "production");

// the right database
const live = "https://abcd1234.supabase.co";
const test = "https://wxyz9876.supabase.co";
t("no expected project set: no check (can't break an existing deployment)", supabaseMismatch(live, undefined) === null && supabaseMismatch(test, "") === null);
t("matching project passes", supabaseMismatch(live, "abcd1234") === null);
t("staging code holding the live URL is refused", supabaseMismatch(live, "wxyz9876") !== null);
t("live code holding the staging URL is refused", supabaseMismatch(test, "abcd1234") !== null);
t("a look-alike host is refused", supabaseMismatch("https://abcd1234.supabase.co.evil.com", "abcd1234") !== null);
t("a prefix-only match is refused", supabaseMismatch("https://abcd12345.supabase.co", "abcd1234") !== null);
t("a missing URL is refused when a project is expected", supabaseMismatch(undefined, "abcd1234") !== null);
t("a junk URL is refused", supabaseMismatch("not a url", "abcd1234") !== null);
t("the expected id is trimmed", supabaseMismatch(live, "  abcd1234 ") === null);

// staging email allowlist
const allow = "tester@example.com, @team.example.org";
t("a listed address may receive email", stagingEmailAllowed("tester@example.com", allow));
t("matching ignores case and spaces", stagingEmailAllowed("  TESTER@Example.com ", allow));
t("a whole listed domain may receive email", stagingEmailAllowed("anyone@team.example.org", allow));
t("an unlisted address may not", !stagingEmailAllowed("real.creator@gmail.com", allow));
t("a look-alike domain may not", !stagingEmailAllowed("x@evilteam.example.org", allow) && !stagingEmailAllowed("x@team.example.org.evil.com", allow));
t("an empty allowlist blocks everyone", !stagingEmailAllowed("tester@example.com", "") && !stagingEmailAllowed("tester@example.com", undefined));

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
