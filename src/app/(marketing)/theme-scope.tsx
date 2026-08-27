import type { ReactNode } from "react";
import { Atmosphere } from "@/components/site/atmosphere";
import { BrandTag } from "@/components/site/brand-tag";

/**
 * The marketing group's own box — and the stacking context the
 * atmosphere layer lives in.
 *
 * `isolate` is load-bearing, not decoration. Atmosphere is
 * `fixed -z-10`, and a negative-z child paints above its stacking
 * context's own background but below every bit of content in it —
 * which is exactly where an ambient backdrop belongs. Without
 * `isolate` this div is not a stacking context, the negative-z child
 * escapes up to the root, and this div's own opaque `bg-background`
 * then paints straight over the top of it: the atmosphere would render
 * and be completely invisible.
 *
 * `bg-background` stays as the floor underneath the atmosphere's own
 * gradients, so scroll overshoot at either end of the page lands on the
 * right color rather than on white.
 *
 * `overflow-x-clip` is a safety net, not a fix for anything currently
 * broken. A single mis-measured absolutely-positioned or 3D-transformed
 * child anywhere on the page can silently widen the document and give
 * the whole site a horizontal scrollbar on mobile — which is exactly
 * what the proof deck did once (see proof-coverflow.tsx). `clip` rather
 * than `hidden` on purpose: `hidden` makes this a scroll container,
 * which breaks `position: sticky` on the navbar inside it. `clip`
 * prevents the overflow without that side effect.
 */
export function MarketingThemeScope({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-full flex-1 flex-col overflow-x-clip bg-background text-foreground">
      <Atmosphere />
      {children}
      {/* The bottom-of-screen name tag. Lives here rather than in the
          layout's flow so it is inside the marketing group only — the
          dashboard and checkout have their own, calmer chrome and do not
          want a floating brand pill over them. */}
      <BrandTag />
    </div>
  );
}
