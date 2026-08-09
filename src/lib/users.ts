import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Real accounts for this demo build: email + password, actually checked.
 * There's no real database, so records live in a local JSON file instead
 * (same approach as leads.ts) — good enough to prove the account model
 * genuinely works (create once, log back in with the same password,
 * wrong password is rejected), not a production credential store. Swap
 * this file's implementation for a real database before going live; the
 * functions below (createUser/verifyUser/getUser) are the boundary to
 * replace, nothing else in the app needs to change.
 *
 * Passwords are salted + hashed with scrypt (Node's built-in crypto, no
 * extra dependency) — never stored in plain text.
 */
const USERS_FILE = path.join(process.cwd(), "data", "users.json");

export type UserRecord = {
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  completedLessons: string[];
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

function deriveDisplayName(email: string): string {
  const namePart = email.split("@")[0] ?? "student";
  return namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, " ");
}

export async function getUser(email: string): Promise<UserRecord | null> {
  const users = await readUsers();
  return users[email.toLowerCase()] ?? null;
}

export async function createUser(
  email: string,
  password: string
): Promise<{ ok: true; user: UserRecord } | { ok: false; error: string }> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    if (users[key]) {
      return { ok: false, error: "An account with this email already exists." };
    }
    const user: UserRecord = {
      email: key,
      passwordHash: hashPassword(password),
      displayName: deriveDisplayName(key),
      createdAt: new Date().toISOString(),
      completedLessons: [],
    };
    users[key] = user;
    await writeUsers(users);
    return { ok: true, user };
  });
}

export async function verifyUser(
  email: string,
  password: string
): Promise<{ ok: true; user: UserRecord } | { ok: false; error: string }> {
  const users = await readUsers();
  const user = users[email.toLowerCase()];
  if (!user) return { ok: false, error: "No account found with that email." };
  if (!verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: "Incorrect password." };
  }
  return { ok: true, user };
}

/** Creates the account if it doesn't exist yet, without requiring a password (used by checkout's instant-access flow). */
export async function ensureUser(email: string): Promise<UserRecord> {
  const key = email.toLowerCase();
  return withUsersLock(async (users) => {
    if (users[key]) return users[key];
    const user: UserRecord = {
      email: key,
      // No password set through checkout — log in with this email later to
      // set one for real via the login form's create-account path.
      passwordHash: hashPassword(randomBytes(24).toString("hex")),
      displayName: deriveDisplayName(key),
      createdAt: new Date().toISOString(),
      completedLessons: [],
    };
    users[key] = user;
    await writeUsers(users);
    return user;
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
