"use client";

import { useEffect, useState } from "react";
import { compactViews } from "@/lib/format";
import { cn } from "@/lib/utils";

export type LeaderboardItem = {
  id: string;
  name: string;
  views: number;
};

/**
 * A creator leaderboard: ranked by views, each row with its view bar, so a brand
 * can see at a glance who is bringing the reach. A soft highlight moves down the
 * rows, as if a brand were looking through them. The numbers are the real ones
 * and never change; only the highlight and the bars move. Under
 * prefers-reduced-motion everything stays still.
 */
export function Leaderboard({ items }: { items: LeaderboardItem[] }) {
  const [active, setActive] = useState(-1);

  const ranked = [...items].sort((a, b) => b.views - a.views);
  const count = items.length;

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % count), 1700);
    return () => clearInterval(id);
  }, [count]);

  if (ranked.length === 0) return null;
  const max = ranked[0].views;

  return (
    <ul className="mt-4 flex flex-col gap-2" aria-hidden>
      {ranked.map((it, i) => {
        const first = i === 0;
        const on = i === active;
        return (
          <li
            key={it.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-500",
              on ? "border-[#ac0216]/60 bg-[#ac0216]/[0.07]" : "border-white/[0.08]",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                first ? "bg-[#ac0216] text-white" : "bg-white/[0.06] text-[#a39e98]",
              )}
            >
              {i + 1}
            </span>
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
              <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <span
                  className={cn("ko-fill block h-full rounded-full", first || on ? "bg-[#ac0216]" : "bg-[#ac0216]/45")}
                  style={{ "--ko-to": `${Math.max(6, (it.views / max) * 100)}%`, animationDelay: `${i * 0.18}s` } as React.CSSProperties}
                />
              </span>
            </span>
            <span className={cn("shrink-0 text-sm font-bold tabular-nums", (first || on) && "text-[#e0556a]")}>
              {compactViews(it.views)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
