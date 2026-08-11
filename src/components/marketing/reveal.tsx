"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades + lifts its children into place the first time they scroll into
 * view. Wraps server-rendered section content from the outside (page.tsx),
 * so the sections themselves don't need to become client components.
 * Content already in the initial viewport (the hero) still gets the
 * animation — IntersectionObserver fires immediately for anything already
 * intersecting on mount, so above-the-fold and below-the-fold behave the
 * same way, on load vs. on scroll respectively.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Belt-and-suspenders: real iOS Safari has had genuine bugs where
    // IntersectionObserver never fires for elements already in the initial
    // viewport on load (no scroll event to trigger its first check). This
    // is only ever a decorative fade-in — it must never be able to hide
    // real content permanently if its trigger doesn't fire, so a fallback
    // timer reveals everything regardless once it's clearly not coming.
    const fallback = window.setTimeout(() => setVisible(true), 1200);

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return () => window.clearTimeout(fallback);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
          window.clearTimeout(fallback);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
