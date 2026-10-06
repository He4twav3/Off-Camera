import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Encryption for withdrawal payment details (IBANs and the like), plus the
 * confirmation-link tokens. The key lives only in the server's environment
 * (WITHDRAWAL_DETAILS_KEY, 32 random bytes as base64), never in the database,
 * so a copy of the database alone does not reveal anyone's bank details.
 *
 *   openssl rand -base64 32
 *
 * Fails closed: with no valid key, nothing is encrypted or stored.
 */

function key(): Buffer {
  const raw = process.env.WITHDRAWAL_DETAILS_KEY;
  if (!raw) throw new Error("WITHDRAWAL_DETAILS_KEY is not set");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("WITHDRAWAL_DETAILS_KEY must be 32 bytes, base64 encoded");
  return k;
}

const b64 = (b: Buffer) => b.toString("base64url");

/** AES-256-GCM. Returns "v1.<iv>.<tag>.<ciphertext>". */
export function encryptDetails(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1.${b64(iv)}.${b64(cipher.getAuthTag())}.${b64(ct)}`;
}

export function decryptDetails(box: string): string {
  const [v, iv, tag, ct] = box.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("Not an encrypted value");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
}

/** Same details always give the same value, so a repeat of known details can be spotted. */
export function hashDetails(plain: string): string {
  const normalized = plain.toLowerCase().replace(/[^\p{L}\p{N}@.]/gu, "");
  return createHmac("sha256", key()).update(`details:${normalized}`).digest("hex");
}

/** The last 4 letters or digits, the only part kept after a request is closed. */
export function last4(plain: string): string {
  return plain.replace(/[^\p{L}\p{N}]/gu, "").slice(-4);
}

/** A fresh confirmation token for the emailed link, and the hash we store. */
export function newConfirmToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
