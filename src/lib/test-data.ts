/**
 * Spotting test and placeholder data so it never sits on the real site unnoticed. Pure (no server imports) so it can
 * be tested. These are guesses from names and addresses, used only to warn an admin, never to delete anything.
 */
const TEST_DOMAIN = /@(oncamera\.test|example\.(com|org|net|test)|mailinator\.com)$/i;
const TEST_LOCAL = /^(test|tester|demo)[._+-]/i;
const TEST_WORD = /\b(staging|sample|placeholder|lorem|dummy|test)\b/i;

export function looksLikeTestEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return TEST_DOMAIN.test(e) || TEST_LOCAL.test(e.split("@")[0] ?? "") || /\+(oc|test)\d*@/.test(e);
}

export function looksLikeTestName(text: string): boolean {
  return TEST_WORD.test(text);
}
