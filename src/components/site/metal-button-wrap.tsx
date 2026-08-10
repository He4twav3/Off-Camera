"use client";

import type { ReactNode } from "react";
import { MetalFx, type MetalFxPreset, type MetalFxVariant } from "@/components/ui/metal-fx";

/**
 * The one client boundary for MetalFx sitewide — wraps a single button/link
 * element (already fully built by the caller) in the animated metal ring.
 * Keeping this as its own tiny client component means Hero, Pricing,
 * FinalCTA etc. can all stay server components; they just wrap their
 * existing button JSX in this instead of importing MetalFx directly.
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
   * to move here now that this div is the actual flex item. */
  className?: string;
}) {
  return (
    <MetalFx preset={preset} variant={variant} theme="dark" className={className}>
      {children}
    </MetalFx>
  );
}
