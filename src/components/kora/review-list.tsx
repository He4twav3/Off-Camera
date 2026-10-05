/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  name: string;
  meta: string; // e.g. "TikTok · 15.1M+ views"
  thumbnail: string | null;
};

const VISIBLE = 4;

/**
 * An example of reviewing creators: the top row gets accepted or passed, slides
 * out, and the next one moves up — looping through the items. A picture of the
 * flow, not a live control (aria-hidden); under prefers-reduced-motion it
 * stays still and just shows the first rows.
 */
export function ReviewList({ items }: { items: ReviewItem[] }) {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<"idle" | "decided" | "leaving">("idle");

  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t =
      phase === "idle"
        ? setTimeout(() => setPhase("decided"), 1900)
        : phase === "decided"
          ? setTimeout(() => setPhase("leaving"), 650)
          : setTimeout(() => {
              setCycle((c) => c + 1);
              setPhase("idle");
            }, 520);
    return () => clearTimeout(t);
  }, [phase, items.length]);

  if (items.length === 0) return null;
  const accepting = cycle % 2 === 0;
  const rows = Array.from({ length: Math.min(VISIBLE, items.length) }, (_, i) => ({
    key: cycle + i,
    item: items[(cycle + i) % items.length],
  }));

  return (
    <ul className="mt-4 flex flex-col" aria-hidden>
      {rows.map(({ key, item }, i) => {
        const top = i === 0;
        const leaving = top && phase === "leaving";
        const decided = top && phase !== "idle";
        return (
          <li
            key={key}
            className={cn(
              "overflow-hidden transition-all duration-500 ease-out",
              leaving ? "max-h-0 -translate-x-6 opacity-0" : "max-h-[88px] opacity-100",
              i === rows.length - 1 && cycle > 0 && "animate-[ko-enter_0.5s_ease-out]",
            )}
          >
            <div className="mb-2 flex items-center gap-3.5 rounded-xl border border-white/[0.08] px-3.5 py-3">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" loading="lazy" className="size-11 shrink-0 rounded-full object-cover object-top" />
              ) : (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-sm font-bold text-[#a39e98]">
                  {item.name.replace("@", "").charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.95rem] font-semibold">{item.name}</span>
                <span className="block truncate text-xs text-[#a39e98]">▶ {item.meta}</span>
              </span>
              <span
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300",
                  decided && accepting ? "scale-95 bg-emerald-500 text-white" : "bg-[#ac0216] text-white",
                  decided && !accepting && "opacity-40",
                )}
              >
                {decided && accepting ? "Accepted" : "Accept"}
              </span>
              <span
                className={cn(
                  "rounded-lg border border-white/[0.14] px-4 py-2 text-sm font-semibold text-[#edeae4] transition-all duration-300",
                  decided && !accepting && "scale-95 border-white/40 bg-white/10",
                  decided && accepting && "opacity-40",
                )}
              >
                {decided && !accepting ? "Passed" : "Pass"}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
