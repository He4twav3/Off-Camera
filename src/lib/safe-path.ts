/**
 * A "where to go next" value from a form, accepted only if it is a path on this
 * site. Anything else (another site, a protocol-relative `//host`, a backslash
 * trick, a missing value) falls back, so a link can never bounce someone off
 * to a look-alike page.
 */
export function safeLocalPath(value: unknown, fallback: string): string {
  const v = typeof value === "string" ? value : "";
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(v)) return fallback;
  return v;
}
