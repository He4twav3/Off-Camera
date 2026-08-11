"use client";

import type { ReactNode } from "react";
import { MetalFx, type MetalFxPreset, type MetalFxVariant } from "@/components/ui/metal-fx";
import { ErrorBoundary } from "@/components/site/error-boundary";

/**
 * The one client boundary for MetalFx sitewide — wraps a single button/link
 * element (already fully built by the caller) in the animated metal ring.
 * Keeping this as its own tiny client component means Hero, Pricing,
 * FinalCTA etc. can all stay server components; they just wrap their
 * existing button JSX in this instead of importing MetalFx directly.
 *
 * Wrapped in an ErrorBoundary: metal-fx does its own WebGL/canvas setup
 * (one shared offscreen renderer for every instance on the page) that
 * hasn't been reproducible in emulated testing but did crash on a real
 * iPhone, taking the *entire* rest of the page blank with it (an uncaught
 * client error unmounts the nearest route segment, not just the button
 * that threw). If it throws, this falls back to the plain button/link
 * exactly as the caller built it, just without the metal ring — degraded,
 * not gone.
 */
export function MetalButtonWrap({
  children,
  preset = "silver",
  variant = "button",
  className,
}: {
  children: ReactNode;
  preset?: MetalFxPreset;
  variant?: MetalFxVariant;
  /** Passed through to MetalFx's own wrapping div — layout classes (ml-auto,
   * hidden lg:inline-flex, etc.) that used to sit on the button itself need
   * to move here now that this div is the actual flex item. Applied to the
   * same plain div in the error fallback so layout doesn't shift either. */
  className?: string;
}) {
  return (
    <ErrorBoundary fallback={<div className={className}>{children}</div>}>
      <MetalFx preset={preset} variant={variant} theme="dark" className={className}>
        {children}
      </MetalFx>
    </ErrorBoundary>
  );
}
