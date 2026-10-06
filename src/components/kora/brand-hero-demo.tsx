"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Megaphone, Users } from "lucide-react";
import { BrowserFrame, Chip } from "./blocks";

/**
 * The brands hero preview: a clickable sidebar that swaps the panel. The
 * Creators panel is real data passed in from the page; Campaigns and Results
 * are EXAMPLE data (invented campaign names, modest figures), not real results.
 */
const SIDEBAR = [
  { icon: Megaphone, label: "Campaigns" },
  { icon: Users, label: "Creators" },
  { icon: BarChart3, label: "Results" },
] as const;

type Label = (typeof SIDEBAR)[number]["label"];

const CAMPAIGNS: [string, string, string, "good" | "accent" | "neutral"][] = [
  ["Summer launch", "TikTok · 6 videos", "Active", "good"],
  ["Product drop", "Instagram · 4 reels", "Reviewing applicants", "accent"],
  ["Spring refresh", "YouTube Shorts · 3 videos", "Finished", "neutral"],
];

const RESULTS = [
  { label: "TikTok", views: 412_000, color: "#25f4ee" },
  { label: "Instagram", views: 186_000, color: "#e1306c" },
  { label: "YouTube", views: 94_000, color: "#ff2d2d" },
];

export function BrandHeroDemo({ creators }: { creators: ReactNode }) {
  const [active, setActive] = useState<Label>("Creators");
  const max = Math.max(...RESULTS.map((r) => r.views));

  return (
    <BrowserFrame
      url="oncameraugc.com/brand"
      badge="Live"
      sidebar={SIDEBAR.map((s) => ({ ...s, active: s.label === active }))}
      onSelect={(label) => setActive(label as Label)}
    >
      <div key={active} className="ko-panel min-h-[26rem]">
        {active === "Creators" && creators}
        {active === "Campaigns" && (
          <>
            <p className="mb-4 font-semibold">Campaigns</p>
            <ul className="flex flex-col gap-2.5">
              {CAMPAIGNS.map(([name, meta, status, tone]) => (
                <li key={name} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] px-4 py-3.5">
                  <span>
                    <span className="font-semibold">{name}</span>
                    <span className="block text-xs text-[#a39e98]">{meta}</span>
                  </span>
                  <Chip tone={tone}>{status}</Chip>
                </li>
              ))}
            </ul>
          </>
        )}
        {active === "Results" && (
          <>
            <p className="mb-4 font-semibold">Results · last 30 days</p>
            <ul className="flex flex-col gap-4">
              {RESULTS.map((r) => (
                <li key={r.label}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-semibold">{r.label}</span>
                    <span className="tabular-nums text-[#a39e98]">{r.views.toLocaleString("en-US")} views</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <span
                      className="ko-bar block h-full origin-left rounded-full"
                      style={{ width: `${(r.views / max) * 100}%`, backgroundColor: r.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </BrowserFrame>
  );
}
