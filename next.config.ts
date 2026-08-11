import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

// Every LAN IPv4 address this machine currently has, so testing the dev
// server from a phone on the same wifi (http://<lan-ip>:3000) isn't
// silently 403'd by Next's cross-origin dev-resource protection. Computed
// at server startup rather than hardcoded: this address already changed
// once this session (wifi reconnect), and hardcoding it here just moves
// the exact same "nothing loads and there's no visible reason why" failure
// from the JS-chunk layer to the config layer the next time it changes.
const lanDevOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((iface): iface is NonNullable<typeof iface> => !!iface && iface.family === "IPv4" && !iface.internal)
  .map((iface) => iface.address);

const nextConfig: NextConfig = {
  // LiquidMetalCanvas (src/components/site/liquid-metal-canvas.tsx) sets up
  // a real WebGL context/program/buffers imperatively in an effect. React
  // 18 strict mode's dev-only mount→cleanup→mount double-invoke reliably
  // left it rendering a visibly fainter pattern in testing (reproduced
  // across repeated loads, not just animation-phase noise) — production
  // never double-invokes regardless of this flag, so this only affects
  // the dev experience, not what ships.
  reactStrictMode: false,
  allowedDevOrigins: lanDevOrigins,
};

export default nextConfig;
