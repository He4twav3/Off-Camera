"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * One scroll listener for the whole page, shared by every component that
 * needs to know where the page is.
 *
 * The alternative — each component adding its own `scroll` listener — is
 * what turns "a few subtle scroll effects" into jank: every listener
 * runs on every scroll event, each one reading layout, on the main
 * thread, while the compositor is trying to scroll. Here the listener is
 * registered once for the first subscriber and removed with the last,
 * reads are coalesced into a single measurement per animation frame no
 * matter how many events fire, and every subscriber reads that same
 * measurement — so two elements reacting to scroll can never disagree
 * about where the page is.
 *
 * Exposed through `useSyncExternalStore`, which is the API React
 * provides for exactly this shape of problem. It's not ceremony: it
 * gives a correct server snapshot for free (so there is nothing for
 * hydration to disagree about), and it lets a subscriber whose snapshot
 * is a *boolean* skip re-rendering on the frames where that boolean
 * didn't change — which is what makes useScrolledPast below cost two
 * renders for a whole page rather than one per frame.
 */
let latestY = 0;
const subscribers = new Set<() => void>();
let frame = 0;

function flush() {
  frame = 0;
  latestY = window.scrollY;
  for (const notify of subscribers) notify();
}

function onScroll() {
  // Coalesce: many scroll events per frame, one read and one broadcast.
  if (frame) return;
  frame = requestAnimationFrame(flush);
}

function subscribe(onStoreChange: () => void) {
  if (subscribers.size === 0) {
    // Seed before the first listener attaches. A reload can restore
    // scroll position partway down the page, and no scroll event fires
    // for that — without this, everything would believe it was at the
    // top until the user happened to move.
    latestY = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }
  subscribers.add(onStoreChange);

  return () => {
    subscribers.delete(onStoreChange);
    if (subscribers.size === 0) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

/** Current vertical scroll offset in px. 0 on the server. */
export function useScrollY(): number {
  return useSyncExternalStore(
    subscribe,
    () => latestY,
    () => 0
  );
}

/**
 * True once the page has scrolled past `threshold` px. Deliberately a
 * boolean rather than the raw offset: React compares snapshots with
 * Object.is, so a component asking this question re-renders twice for
 * the entire page instead of once per scrolled frame.
 */
export function useScrolledPast(threshold: number): boolean {
  const getSnapshot = useCallback(() => latestY > threshold, [threshold]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
