"use client";

import { useEffect, useRef } from "react";
import { compactViews } from "@/lib/format";

/** A number that counts up from 0 once it scrolls into view. The server renders
 * the final value; the DOM is written directly while animating (no re-render per
 * frame). Under prefers-reduced-motion it just shows the number. */
export function CountUp({
  to,
  duration = 1400,
  compact = false,
}: {
  to: number;
  duration?: number;
  /** Show 26.2M / 950K instead of 26,200,000. */
  compact?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const format = (n: number) => (compact ? compactViews(n) : Math.round(n).toLocaleString("en-US"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      el.textContent = format(to);
      return;
    }
    el.textContent = compact ? "0" : "0";
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          el.textContent = format(to * (1 - Math.pow(1 - t, 3)));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration, compact]);

  return <span ref={ref}>{compact ? compactViews(to) : to.toLocaleString("en-US")}</span>;
}
