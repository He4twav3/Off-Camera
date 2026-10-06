"use client";

import { useEffect, useState } from "react";
import { compactViews } from "@/lib/format";

export type LeaderboardItem = {
  id: string;
  name: string;
  views: number;
};

const CARD = 66; // px, fixed so rows can glide to exact slots
const GAP = 8;
const ROW = CARD + GAP;
// Which neighbouring pair of slots trades places on each step. Cycling through
// different pairs lets every creator move both up and down over time.
const PAIRS = [0, 2, 1, 3, 0, 1, 2, 3];

/**
 * An example applicants list for brands: each creator with their views and
 * static Accept / Pass buttons. Every couple of seconds two neighbouring
 * creators swap places, each row sliding smoothly into its new slot, so the
 * list keeps shifting with no gap. The numbers are the real ones and never
 * change; only the order does. A picture of the flow, not a live control
 * (aria-hidden); under prefers-reduced-motion it stays still.
 */
export function Leaderboard({ items }: { items: LeaderboardItem[] }) {
  // order[slot] = index into items
  const [order, setOrder] = useState(() => items.map((_, i) => i));
  const [step, setStep] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setStep((s) => s + 1), 2300);
    return () => clearInterval(id);
  }, [count]);

  useEffect(() => {
    if (step === 0 || count < 2) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder((prev) => {
      const next = [...prev];
      const a = PAIRS[(step - 1) % PAIRS.length] % (count - 1);
      [next[a], next[a + 1]] = [next[a + 1], next[a]];
      return next;
    });
  }, [step, count]);

  if (count === 0) return null;
  const slotOf = new Map(order.map((itemIndex, slot) => [itemIndex, slot]));

  return (
    <div className="relative mt-4" style={{ height: count * ROW - GAP }} aria-hidden>
      {items.map((it, i) => (
        <div
          key={it.id}
          style={{ height: CARD, transform: `translateY(${(slotOf.get(i) ?? i) * ROW}px)` }}
          className="absolute inset-x-0 top-0 flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#1d1c22] px-3 transition sm:gap-3.5 sm:px-3.5-transform duration-[900ms] ease-in-out"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.95rem] font-semibold">
              {it.name.startsWith("@") ? (
                <>
                  <span className="text-[#a39e98]">@</span>
                  {it.name.slice(1)}
                </>
              ) : (
                it.name
              )}
            </span>
            <span className="block truncate text-xs text-[#a39e98]">▶ {compactViews(it.views)} views</span>
          </span>
          <span className="rounded-lg bg-[#ac0216] px-2.5 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm">Accept</span>
          <span className="rounded-lg border border-white/[0.14] px-2.5 py-1.5 text-xs font-semibold text-[#edeae4] sm:px-4 sm:py-2 sm:text-sm">Pass</span>
        </div>
      ))}
    </div>
  );
}
