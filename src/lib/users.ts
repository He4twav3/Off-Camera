import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

/**
 * Real accounts for this demo build: email + password, actually checked.
 * There's no real database, so records live in a local JSON file instead
 * (same approach as leads.ts) — good enough to prove the account model
 * genuinely works (create once, log back in with the same password,
 * wrong password is rejected, too many wrong passwords locks it out,
 * forgotten passwords are recoverable by real token, not just re-typing
 * the email), not a production credential store. Swap this file's
 * implementation for a real database before going live; the exported
 * functions are the boundary to replace, nothing else in the app needs
 * to change.
 *
 * Passwords are salted + hashed with scrypt (Node's built-in crypto, no
 * extra dependency) — never stored in plain text. Reset/verify tokens are
 * high-entropy random values, only their SHA-256 hash is ever stored (the
 * raw token is shown/"emailed" once, same principle as a password: if the
 * stored copy leaks, it's useless without the original).
 */
const USERS_FILE = path.join(process.cwd(), "data", "users.json");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export type UserRecord = {
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  completedLessons: string[];
  emailVerified: boolean;
  verifyTokenHash?: string;
  verifyTokenExpiresAt?: string;
  resetTokenHash?: string;
  resetTokenExpiresAt?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  /** Set only by a confirmed payment webhook (Stripe or NOWPayments) —
   * never by the client, never optimistically. This is the actual gate on
   * course access; an account existing (free signup) is not the same
   * thing as having paid for it. See markUserPaid() and dashboard access
   * checks that read this field. */
  paid: boolean;
  paidAt?: string;
  /** Which rail the confirmed payment came through, and that processor's
   * own id for it — useful for support/refund lookups later. */
  paymentProvider?: "stripe" | "nowpayments";
  paymentReference?: string;
};

type UserStore = Record<string, UserRecord>;

async function readUsers(): Promise<UserStore> {
  try {
    const raw = await readFile(USERS_FILE, "utf8");
    return JSON.parse(raw) as UserStore;
  } catch {
    return {};
  }
}

async function writeUsers(users: UserStore) {
  await mkdir(path.dirname(USERS_FILE), { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

// Serializes read-modify-write access to the file within this process, so
// two lessons toggled in quick succession don't race and clobber each
// other. Doesn't help across multiple processes/instances — a real
// database (the intended replacement, see the file header) handles that
// for free.
let writeQueue: Promise<unknown> = Promise.resolve();
function withUsersLock<T>(fn: (users: UserStore) => Promise<T>): Promise<T> {
  const result = writeQueue.then(async () => fn(await readUsers()));
  writeQueue = result.catch(() => {});
  return result;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/** Random 32-byte token, hex-encoded — used for both reset and verify links. */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function tokenMatches(candidate: string, storedHash: string | undefined): boolean {
  if (!storedHash) return false;
  const candidateHash = Buffer.from(hashToken(candidate), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return candidateHash.length === expected.length && timingSafeEqual(candidateHash, expected);
}

function isExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return true;
  return Date.now() > new Date(expiresAt).getTime();
}

function deriveDisplayName(email: string): string {
  const namePart = email.split("@")[0] ?? "student";
  return namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, " ");
}

export async function getUser(email: string): Promise<UserRecord | null> {
  const users = await readUsers();
  return users[email.toLowerCase()] ?? null;
}

/**
 * Creates the account and a fresh email-verify token in one write.
 * Returns the raw token so the caller can "send" (see mailer.ts) the
 * verify link — it's never stored anywhere, only its hash is.
 */
export async function createUser(
  email: string,
  password: string
): Promise<
  | { ok: true; user: UserRecord; verifyToken: string }
  | { ok: false; error: string }
> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    if (users[key]) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const verifyToken = generateToken();
    const user: UserRecord = {
      email: key,
      passwordHash: hashPassword(password),
      displayName: deriveDisplayName(key),
      createdAt: new Date().toISOString(),
      completedLessons: [],
      emailVerified: false,
      verifyTokenHash: hashToken(verifyToken),
      verifyTokenExpiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString(),
      failedLoginAttempts: 0,
      paid: false,
    };
    users[key] = user;
    await writeUsers(users);
    return { ok: true, user, verifyToken };
  });
}

/**
 * Real rate limiting, not just a password check: locked-out accounts are
 * rejected before the password is even compared, wrong passwords count
 * toward the lockout, and a correct one clears the counter. Lockout state
 * lives on the account record (survives a dev-server restart, unlike an
 * in-memory map) — the honest local equivalent of what a real login
 * endpoint would track in Redis/the database.
 */
export async function verifyUser(
  email: string,
  password: string
): Promise<{ ok: true; user: UserRecord } | { ok: false; error: string }> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    const user = users[key];
    if (!user) return { ok: false, error: "No account found with that email." };

    if (user.lockedUntil && !isExpired(user.lockedUntil)) {
      const minutesLeft = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
      );
      return {
        ok: false,
        error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}, or reset your password.`,
      };
    }

    if (!verifyPassword(password, user.passwordHash)) {
      user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_MS).toISOString();
        await writeUsers(users);
        return {
          ok: false,
          error: "Too many failed attempts. This account is locked for 15 minutes — reset your password to get back in sooner.",
        };
      }
      await writeUsers(users);
      const remaining = MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;
      return {
        ok: false,
        error: `Incorrect password. ${remaining} attempt${remaining === 1 ? "" : "s"} left before this account is temporarily locked.`,
      };
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await writeUsers(users);
    return { ok: true, user };
  });
}

/**
 * Creates the account if it doesn't exist yet, without requiring a
 * password. Only ever called from confirmed-payment fulfillment (see
 * fulfillment.ts) — never from client-submitted checkout form data
 * directly, since that would grant access without an actual charge
 * having happened. Reports whether it actually created one, so the
 * caller only sends a verify email for genuinely new accounts.
 */
export async function ensureUser(
  email: string
): Promise<{ user: UserRecord; isNew: boolean; verifyToken?: string }> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    if (users[key]) return { user: users[key], isNew: false };
    const verifyToken = generateToken();
    const user: UserRecord = {
      email: key,
      // No password set through checkout — log in with this email later to
      // set one for real via the login form's create-account path, or use
      // "forgot password" to set one directly.
      passwordHash: hashPassword(randomBytes(24).toString("hex")),
      displayName: deriveDisplayName(key),
      createdAt: new Date().toISOString(),
      completedLessons: [],
      emailVerified: false,
      verifyTokenHash: hashToken(verifyToken),
      verifyTokenExpiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString(),
      failedLoginAttempts: 0,
      paid: false,
    };
    users[key] = user;
    await writeUsers(users);
    return { user, isNew: true, verifyToken };
  });
}

/**
 * Marks an account as paid — the one and only function allowed to flip
 * `paid` to true, and it's only ever called from confirmed-payment
 * fulfillment (a verified Stripe webhook/PaymentIntent retrieve, or a
 * verified NOWPayments IPN), never from anything a browser submits
 * directly. Idempotent: safe to call more than once for the same
 * purchase (Stripe can deliver the same webhook event more than once by
 * design, and the confirm-redirect route and the webhook both call this
 * for the same payment as a belt-and-suspenders pair) — a second call
 * just re-confirms the same state instead of erroring.
 */
export async function markUserPaid(
  email: string,
  provider: "stripe" | "nowpayments",
  reference: string
): Promise<{ ok: true; alreadyPaid: boolean } | { ok: false; error: string }> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    const user = users[key];
    if (!user) return { ok: false, error: "Account not found." };
    const alreadyPaid = user.paid;
    user.paid = true;
    user.paidAt = user.paidAt ?? new Date().toISOString();
    user.paymentProvider = user.paymentProvider ?? provider;
    user.paymentReference = user.paymentReference ?? reference;
    await writeUsers(users);
    return { ok: true, alreadyPaid };
  });
}

/** Changes the password for an already-authenticated account — requires the current password, same as any real "change password" form. */
export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    const user = users[key];
    if (!user) return { ok: false, error: "Account not found." };
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return { ok: false, error: "Current password is incorrect." };
    }
    user.passwordHash = hashPassword(newPassword);
    await writeUsers(users);
    return { ok: true };
  });
}

/**
 * Starts a password-reset: generates + stores a token if the account
 * exists. Always returns the same shape either way (only `token` differs)
 * so the caller can give a non-leaking response ("if that account exists,
 * here's the link") without an extra existence check of its own.
 */
export async function requestPasswordReset(
  email: string
): Promise<{ exists: boolean; token?: string }> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    const user = users[key];
    if (!user) return { exists: false };
    const token = generateToken();
    user.resetTokenHash = hashToken(token);
    user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    await writeUsers(users);
    return { exists: true, token };
  });
}

/** Completes a password reset: valid, unexpired token required. Also clears any active lockout — proving account ownership via the emailed token is a legitimate way back in, not just waiting out the timer. */
export async function resetPasswordWithToken(
  email: string,
  token: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    const user = users[key];
    if (!user) return { ok: false, error: "Invalid or expired reset link." };
    if (!tokenMatches(token, user.resetTokenHash) || isExpired(user.resetTokenExpiresAt)) {
      return { ok: false, error: "Invalid or expired reset link. Request a new one." };
    }
    user.passwordHash = hashPassword(newPassword);
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await writeUsers(users);
    return { ok: true };
  });
}

/** Issues a fresh verify-email token (for the "resend" action) — doesn't touch anything else on the account. */
export async function createVerificationToken(
  email: string
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    const user = users[key];
    if (!user) return { ok: false, error: "Account not found." };
    if (user.emailVerified) return { ok: false, error: "This email is already verified." };
    const token = generateToken();
    user.verifyTokenHash = hashToken(token);
    user.verifyTokenExpiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString();
    await writeUsers(users);
    return { ok: true, token };
  });
}

export async function verifyEmailToken(
  email: string,
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    const user = users[key];
    if (!user) return { ok: false, error: "Invalid or expired verification link." };
    if (user.emailVerified) return { ok: true };
    if (!tokenMatches(token, user.verifyTokenHash) || isExpired(user.verifyTokenExpiresAt)) {
      return { ok: false, error: "Invalid or expired verification link. Request a new one." };
    }
    user.emailVerified = true;
    user.verifyTokenHash = undefined;
    user.verifyTokenExpiresAt = undefined;
    await writeUsers(users);
    return { ok: true };
  });
}

export async function setLessonCompletion(email: string, lessonId: string, done: boolean) {
  const key = email.toLowerCase();
  await withUsersLock(async (users) => {
    const user = users[key];
    if (!user) return;
    const set = new Set(user.completedLessons);
    if (done) set.add(lessonId);
    else set.delete(lessonId);
    user.completedLessons = [...set];
    await writeUsers(users);
  });
}

export async function resetUserProgress(email: string) {
  const key = email.toLowerCase();
  await withUsersLock(async (users) => {
    if (users[key]) {
      users[key].completedLessons = [];
      await writeUsers(users);
    }
  });
}
