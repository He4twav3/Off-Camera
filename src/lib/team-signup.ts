import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Pieces of the team (admin) sign-up at /team.
 *
 * The page is closed unless TEAM_SIGNUP_KEY is set in the server environment,
 * and it is meant to stay closed: set the key, let the team sign up, then
 * remove it. A key shorter than 16 characters is treated as not set.
 */

/** Constant-time comparison. False when no usable key is configured. */
export function keyMatches(input: string, expected: string | undefined): boolean {
  if (!expected || expected.length < 16) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function teamSignupOpen(expected: string | undefined): boolean {
  return Boolean(expected && expected.length >= 16);
}

const COMMON = ["password", "123456", "qwerty", "letmein", "welcome", "admin", "oncamera", "iloveyou"];

/** Admin passwords are held to a stricter rule than creator ones. Returns an error message, or null. */
export function checkTeamPassword(password: string, email: string): string | null {
  if (password.length < 12) return "Use a password of at least 12 characters.";
  if (password.length > 128) return "That password is too long (128 characters at most).";
  if (new Set(password).size < 5) return "That password is too repetitive. Mix it up.";
  const lower = password.toLowerCase();
  if (COMMON.some((c) => lower.includes(c))) return "That password is too easy to guess.";
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 4 && lower.includes(local)) return "Your password shouldn't contain your email name.";
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (classes < 3) return "Use at least three of: lowercase, UPPERCASE, numbers, symbols.";
  return null;
}
