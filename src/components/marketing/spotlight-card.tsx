"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A card that is lit by the cursor.
 *
 * The page's whole visual language is "surfaces catching light" — the
 * elevation ramp, the lit top hairline on every card, the atmosphere
 * layer, the pools of light behind the hero and the pricing card. Every
 * one of those is static, though: the light is painted on. The moment a
 * surface responds to where the pointer actually is, the same language
 * stops being a texture and starts being a physical property of the
 * object, and that is most of what separates a card that looks premium
 * in a screenshot from one that feels premium to use.
 *
 * Defined once and shared, rather than re-implemented per section. Before
 * this, the belief cards had a hand-rolled version of the idea — a pool
 * of light hard-coded at the top-left corner, fading in on hover — and
 * every other card on the page had nothing. One card with a bespoke
 * hover treatment is an inconsistency; the same treatment on every card
 * that takes a cursor is a system.
 *
 * Three things keep it from being a gimmick:
 *
 *  - It only ever adds light, never takes any away, and it sits under
 *    the content (`-z-10` inside an isolated stacking context), so text
 *    contrast is unaffected at every pointer position.
 *  - Pointer tracking is rAF-coalesced and writes two CSS custom
 *    properties. No React state per move, no re-render per frame, no
 *    layout read — `getBoundingClientRect` is called once per frame on
 *    an element the user is already hovering.
 *  - It does nothing at all on touch. `pointermove` fires on a tap-drag,
 *    so without the `pointerType` check a phone gets a light that
 *    appears under the thumb and then stays wherever the finger left it,
 *    which reads as a rendering bug. Touch devices get the card exactly
 *    as it was.
 */
export function SpotlightCard({
  children,
  className,
  /** Radius of the pool, in px. Larger cards want a wider light. */
  size = 320,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  size?: number;
  as?: "div" | "article" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [lit, setLit] = useState(false);

  function handlePointerMove(event: React.PointerEvent) {
    if (event.pointerType !== "mouse") return;
    if (frame.current) return;
    const { clientX, clientY } = event;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const element = ref.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      element.style.setProperty("--spot-x", `${clientX - rect.left}px`);
      element.style.setProperty("--spot-y", `${clientY - rect.top}px`);
    });
  }

  return (
    <Tag
      ref={ref as never}
      onPointerMove={handlePointerMove}
      onPointerEnter={(event: React.PointerEvent) => {
        if (event.pointerType === "mouse") setLit(true);
      }}
      onPointerLeave={() => {
        setLit(false);
        if (frame.current) {
          cancelAnimationFrame(frame.current);
          frame.current = 0;
        }
      }}
      className={cn("relative isolate", className)}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] transition-opacity duration-300 ease-[var(--ease-cinematic)] motion-reduce:transition-none",
          lit ? "opacity-100" : "opacity-0"
        )}
        style={{
          // Falls back to the card's own top-left before the first
          // pointer frame lands, so the light never starts at 0,0 of the
          // viewport on the first hover.
          background:
            `radial-gradient(${size}px circle at var(--spot-x, 20%) var(--spot-y, 0%), ` +
            "oklch(1 0 0 / 0.09) 0%, oklch(1 0 0 / 0.035) 38%, transparent 70%)",
        }}
      />
      {children}
    </Tag>
  );
}
