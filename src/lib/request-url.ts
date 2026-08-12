import { headers } from "next/headers";
import { siteConfig } from "@/lib/site-config";

/**
 * The origin the current request actually came in on — localhost:3000,
 * the LAN IP a phone hit it on, or the real domain once deployed.
 * Server actions (unlike route handlers) have no Request object to read
 * this from directly, so it's reconstructed from the Host header, which
 * Next always sets accurately to what the client connected to.
 *
 * This matters for any link embedded in an "email" (see mailer.ts):
 * building it from siteConfig.url would point a reset/verify link at the
 * placeholder production domain even when testing locally, making the
 * link the app just handed you completely useless to click through.
 * Falls back to siteConfig.url only if headers() is unavailable (not a
 * real request context).
 */
export async function getBaseUrl(): Promise<string> {
  try {
    const headerStore = await headers();
    const host = headerStore.get("host");
    if (!host) return siteConfig.url;
    const proto = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") || /^\d/.test(host) ? "http" : "https");
    return `${proto}://${host}`;
  } catch {
    return siteConfig.url;
  }
}
