import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LiquidMetalCanvas (src/components/site/liquid-metal-canvas.tsx) sets up
  // a real WebGL context/program/buffers imperatively in an effect. React
  // 18 strict mode's dev-only mount→cleanup→mount double-invoke reliably
  // left it rendering a visibly fainter pattern in testing (reproduced
  // across repeated loads, not just animation-phase noise) — production
  // never double-invokes regardless of this flag, so this only affects
  // the dev experience, not what ships.
  reactStrictMode: false,
};

export default nextConfig;
