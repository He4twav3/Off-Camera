"use client";

import { useEffect, useState } from "react";
import { TikTokIcon, InstagramIcon, YouTubeIcon } from "@/components/marketing/platform-icons";
import { cn } from "@/lib/utils";

/**
 * The creator analytics view: a views total for the last 7 days that switches
 * between All / TikTok / Instagram / YouTube, with a daily bar chart and a
 * change figure. It cycles through the tabs on its own (click one to take
 * over); under prefers-reduced-motion it stays on "All".
 *
 * ALL FIGURES HERE ARE EXAMPLE DATA for the dashboard preview — the window
 * around it is labelled "Example data". They are internally consistent
 * (All = TikTok + Instagram + YouTube) but are not real results.
 */
const TABS = [
  { id: "all", label: "All", Icon: null, views: 2_847_310, change: 18, bars: [52, 61, 48, 70, 66, 58, 84] },
  { id: "tiktok", label: "TikTok", Icon: TikTokIcon, views: 1_924_880, change: 22, bars: [46, 58, 55, 72, 60, 68, 90] },
  { id: "instagram", label: "Instagram", Icon: InstagramIcon, views: 612_440, change: 9, bars: [60, 52, 74, 58, 80, 66, 72] },
  { id: "youtube", label: "YouTube", Icon: YouTubeIcon, views: 309_990, change: 14, bars: [40, 48, 44, 56, 52, 62, 70] },
] as const;

export function AnalyticsPanel() {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % TABS.length), 3200);
    return () => clearInterval(t);
  }, [auto]);

  const tab = TABS[index];

  return (
    <div className="mt-4 rounded-2xl border border-white/[0.08] p-5 sm:p-6">
      <div role="tablist" className="flex flex-nowrap gap-x-3 border-b sm:gap-x-6 border-white/[0.07] pb-3">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={i === index}
            onClick={() => {
              setAuto(false);
              setIndex(i);
            }}
            className={cn(
              "relative flex items-center gap-1.5 whitespace-nowrap pb-2 text-[0.85rem] transition-colors sm:gap-2 sm:text-[0.95rem]",
              i === index ? "font-semibold text-[#edeae4]" : "text-[#a39e98] hover:text-[#edeae4]",
            )}
          >
            {t.Icon && <t.Icon className="size-4" />}
            {t.label}
            {i === index && <span className="absolute inset-x-0 -bottom-[13px] h-0.5 rounded-full bg-[#ac0216]" />}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <p>
          <span key={tab.id} className="text-5xl font-bold tracking-[-0.03em] tabular-nums sm:text-6xl">
            {tab.views.toLocaleString("en-US")}
          </span>{" "}
          <span className="ml-2 text-[0.95rem] text-[#a39e98]">views · last 7 days</span>
        </p>
        <span className="text-sm font-semibold text-[#e0556a]">▲ {tab.change}%</span>
      </div>

      <div className="mt-6 flex h-28 items-end gap-3" aria-hidden>
        {tab.bars.map((h, i) => (
          <span
            key={`${tab.id}-${i}`}
            style={{ height: `${h}%`, transitionDelay: `${i * 40}ms` }}
            className={cn(
              "flex-1 rounded-md transition-[height] duration-700 ease-out",
              i === tab.bars.length - 1 ? "bg-[#ac0216]" : "bg-[#ac0216]/25",
            )}
          />
        ))}
      </div>
    </div>
  );
}
