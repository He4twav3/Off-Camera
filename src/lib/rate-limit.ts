import "server-only";
import { headers } from "next/headers";

/**
 * A small sliding-window rate limiter for public forms (signup, codes, login).
 *
 * LIMITATION, stated plainly: the counters live in this server instance's
 * memory. On a serverless host each instance has its own, so this blunts
 * bursts and casual abuse but a determined attacker spread across instances
 * can exceed it. For a hard guarantee, back it with a shared store (Upstash
 * Redis / Vercel KV) — the function signature below is meant to stay the same.
 */

const buckets = new Map<string, number[]>();

/** True if the action is allowed; false once `limit` calls happened inside `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);

  // Keep memory bounded: drop empty/expired buckets now and then.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}

/** The caller's IP as the host reports it. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
