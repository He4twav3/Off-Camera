import { cn } from "@/lib/utils";

/**
 * The page's living background.
 *
 * The problem this solves: a dark page with a lot of vertical space
 * between its content reads as *empty* rather than as *deep*. Sections
 * end up looking like flat cards floating on nothing, because there is
 * nothing behind them for them to float in front of. Depth needs
 * something to be deep relative to.
 *
 * So this is a room, built in four layers, back to front:
 *
 *   1. A vertical wash that keeps the very top of the page fractionally
 *      lighter than the very bottom, so the page has a direction.
 *   2. Three large, heavily blurred pools of light — a key source above
 *      the fold, a weaker fill from the left at mid-page, and a third
 *      low down before the close so the last screen isn't a dead zone.
 *      All three are plain white at 4–7%, because in a palette with no
 *      hue, atmosphere is light and nothing else. They drift on 38–64s
 *      cycles that never re-synchronise, so nothing about the movement
 *      is ever countable.
 *   3. Grain, to keep gradients this large from banding on 8-bit
 *      displays and to give the whole thing the texture of a dark
 *      photographic frame rather than a rendered gradient.
 *   4. A soft top-edge falloff so the sticky navbar has something to
 *      sit against.
 *
 * Two deliberate constraints, both of which are what keeps this on the
 * "premium cinematic" side of the line rather than the "gaming
 * site / generic AI landing page" side:
 *
 *   - They live at 4–7% opacity. They are meant to be noticed as the
 *     page having atmosphere, never as shapes. If you can identify a
 *     blob, it is too strong.
 *   - Nothing here is scroll-linked. The whole layer is `fixed`, which
 *     means scrolling produces real parallax against it (content moves,
 *     the light stays) at zero cost — no scroll listener, no per-frame
 *     work, nothing to jank. Every animation is transform/opacity only,
 *     runs on the compositor, and stops entirely under
 *     `prefers-reduced-motion`.
 *
 * Rendered once per marketing page from the layout, behind everything,
 * inert to input and to screen readers.
 */
export function Atmosphere({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      {/* 1 — directional wash. Pure lightness steps, no hue: the top of
          the page sits ~4% brighter than the bottom, which is enough to
          give a long scroll a sense of descending into something. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.188_0_0)_0%,oklch(0.152_0_0)_38%,oklch(0.132_0_0)_100%)]" />

      {/* 2 — drifting pools of light. blur-3xl on an already-soft radial
          is intentional belt-and-braces: it guarantees no visible edge
          even on displays that round gradient stops harshly. */}
      <div className="atmos-drift-a atmos-breathe absolute -top-[28%] left-[46%] h-[75vh] w-[75vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(1_0_0_/_0.07)_0%,transparent_66%)] blur-3xl" />
      <div className="atmos-drift-b absolute top-[34%] -left-[18%] h-[62vh] w-[62vh] rounded-full bg-[radial-gradient(circle,oklch(1_0_0_/_0.05)_0%,transparent_68%)] blur-3xl" />
      <div className="atmos-drift-c absolute top-[68%] -right-[14%] h-[68vh] w-[68vh] rounded-full bg-[radial-gradient(circle,oklch(1_0_0_/_0.045)_0%,transparent_66%)] blur-3xl" />

      {/* 3 — grain. soft-light rather than overlay so it textures the
          mid-tones without lifting the blacks into grey. */}
      <div className="atmos-grain absolute inset-0 opacity-[0.16] mix-blend-soft-light" />

      {/* 4 — top falloff, so the sticky navbar reads as sitting on the
          page rather than cutting it. */}
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,oklch(0.11_0_0_/_0.85)_0%,transparent_100%)]" />
    </div>
  );
}
