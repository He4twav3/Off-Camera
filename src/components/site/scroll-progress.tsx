"use client";

import { useEffect, useState } from "react";
import { useScrollY } from "@/lib/use-scroll-y";

/**
 * How far through the page you are, as a hairline across the bottom edge
 * of the navbar.
 *
 * The one piece of continuously scroll-linked motion on the site, and it
 * earns that by carrying information rather than decoration: on a page
 * this long, "how much further does this go?" is a real question, and an
 * unanswered one is a reason to leave. It also gives the scroll a sense
 * of progress being made, which is the quiet motivational note the whole
 * page is going for.
 *
 * Reads its own scrollable height on mount and on resize, because the
 * document grows as embeds load — a progress bar calibrated once at
 * mount would drift out of true the moment a TikTok embed resolved.
 */
export function ScrollProgress() {
  const y = useScrollY();
  const [scrollable, setScrollable] = useState(0);

  useEffect(() => {
    const measure = () =>
      setScrollable(
        document.documentElement.scrollHeight - document.documentElement.clientHeight
      );
    measure();

    // ResizeObserver on <body> rather than a resize listener: the height
    // that matters here changes when *content* changes (embeds loading,
    // an accordion opening), not only when the window does.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const progress = scrollable > 0 ? Math.min(1, Math.max(0, y / scrollable)) : 0;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-crimson to-crimson-bright"
        style={{
          // scaleX rather than width: a transform composites, a width
          // change relayouts the element on every single scroll frame.
          transform: `scaleX(${progress})`,
        }}
      />
    </div>
  );
}
