"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only once confirmed at/above the `lg` breakpoint,
 * client-side — not just CSS-hidden below it. Defaults to not rendering on
 * both the server and the first client paint (so there's no hydration
 * mismatch), then mounts after an effect confirms the media query matches.
 *
 * Use this instead of `hidden lg:*` when what's inside genuinely shouldn't
 * exist in the DOM at all on small screens — e.g. metal-fx sets up a real
 * WebGL renderer and measures its own container on mount; mounting it into
 * a `display:none` box (CSS-hidden rather than absent) still runs all of
 * that setup against a zero-size element for nothing, and produced actual
 * invalid-attribute console errors from its own internal sizing math.
 */
export function DesktopOnlyMount({
  children,
  breakpoint = 1024,
  className,
}: {
  children: ReactNode;
  /** Pixel width to match at/above. Keep in sync with the `lg:` usage this replaces. */
  breakpoint?: number;
  className?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
    setShow(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setShow(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  if (!show) return null;
  return <div className={className}>{children}</div>;
}
