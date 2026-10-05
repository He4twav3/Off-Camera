import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const lanDevOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((iface): iface is NonNullable<typeof iface> => !!iface && iface.family === "IPv4" && !iface.internal)
  .map((iface) => iface.address);

/**
 * Security headers on every response.
 *
 * - X-Frame-Options / frame-ancestors: nobody can put this site in a frame
 *   (clickjacking).
 * - nosniff, Referrer-Policy, Permissions-Policy: stop type-guessing, limit what
 *   is leaked in referrers, and switch off camera/mic/location the site never uses.
 * - HSTS: browsers only ever use https for this domain.
 * - A deliberately small Content-Security-Policy: base-uri, object-src and
 *   form-action are locked down. script-src/style-src are NOT restricted — a
 *   full CSP needs per-request nonces for Next's inline scripts and would break
 *   the pages if guessed; add that as its own, tested step.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: lanDevOrigins,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
