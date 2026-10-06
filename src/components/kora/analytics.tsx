"use client";

import { useEffect, useRef, useState } from "react";
import { TikTokIcon, InstagramIcon, YouTubeIcon } from "@/components/marketing/platform-icons";
import { cn } from "@/lib/utils";

/**
 * The creator analytics view: a views total for the last 7 days that switches
 * between All / TikTok / Instagram / YouTube, with a daily bar chart and a
 * change figure. It cycles through the tabs on its own (click one to take
 * over); under prefers-reduced-motion it stays on "All".
 *
 * ALL FIGURES HERE ARE EXAMPLE DATA for the dashboard preview. They are
 * internally consistent (All = TikTok + Instagram + YouTube) but are not real
 * results, so keep them out of anything that claims to be real.
 */
// `color` fills the bars and underline; `text` is a lighter shade for the change figure.
const TABS = [
  { id: "all", label: "All", Icon: null, color: "#ac0216", text: "#e0556a", views: 2_847_310, change: 18, bars: [52, 61, 48, 70, 66, 58, 84] },
  { id: "tiktok", label: "TikTok", Icon: TikTokIcon, color: "#25f4ee", text: "#5ef7f2", views: 1_924_880, change: 22, bars: [46, 58, 55, 72, 60, 68, 90] },
  { id: "instagram", label: "Instagram", Icon: InstagramIcon, color: "#e1306c", text: "#f0658f", views: 612_440, change: 9, bars: [60, 52, 74, 58, 80, 66, 72] },
  { id: "youtube", label: "YouTube", Icon: YouTubeIcon, color: "#ff2d2d", text: "#ff6b6b", views: 309_990, change: 14, bars: [40, 48, 44, 56, 52, 62, 70] },
] as const;

/** The views figure glides from its old value to the new one instead of jumping. */
function useTween(target: number) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setValue(target), 0);
      return () => clearTimeout(t);
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 700);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = origin + (target - origin) * eased;
      from.current = v;
      setValue(Math.round(v));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

export function AnalyticsPanel() {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % TABS.length), 3200);
    return () => clearInterval(t);
  }, [auto]);

  const tab = TABS[index];
  const views = useTween(tab.views);

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
            <span
              style={{ backgroundColor: t.color }}
              className={cn(
                "absolute inset-x-0 -bottom-[13px] h-0.5 origin-left rounded-full transition-transform duration-300 ease-out",
                i === index ? "scale-x-100" : "scale-x-0",
              )}
            />
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <p>
          <span className="text-5xl font-bold tracking-[-0.03em] tabular-nums sm:text-6xl">
            {views.toLocaleString("en-US")}
          </span>{" "}
          <span className="ml-2 text-[0.95rem] text-[#a39e98]">views · last 7 days</span>
        </p>
        <span style={{ color: tab.text }} className="text-sm font-semibold transition-colors duration-500">
          ▲ {tab.change}%
        </span>
      </div>

      <div className="mt-6 flex h-28 items-end gap-3" aria-hidden>
        {tab.bars.map((h, i) => (
          <span
            key={i}
            style={{
              height: `${h}%`,
              transitionDelay: `${i * 30}ms`,
              backgroundColor:
                i === tab.bars.length - 1 ? tab.color : `color-mix(in srgb, ${tab.color} 28%, transparent)`,
            }}
            className="flex-1 rounded-md transition-[height,background-color] duration-700 ease-out"
          />
        ))}
      </div>
    </div>
  );
}
