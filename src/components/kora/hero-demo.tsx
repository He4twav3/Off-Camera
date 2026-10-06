"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, BarChart3, Briefcase, MessageCircle, Wallet } from "lucide-react";
import { BrowserFrame, Chip, StatTile } from "./blocks";
import { CountUp } from "./count-up";
import { AnalyticsPanel } from "./analytics";
import { cn } from "@/lib/utils";

/**
 * The hero dashboard preview. The tab bar is clickable and swaps the panel,
 * like the real dashboard would.
 *
 * ALL NAMES AND FIGURES HERE ARE EXAMPLE DATA. They are consistent with each
 * other (Earned = the paid rows, Pending = the pending rows) but are not real
 * results, so keep them out of anything that claims to be real.
 */
const TABS = [
  { icon: BarChart3, label: "Analytics" },
  { icon: Briefcase, label: "Campaigns" },
  { icon: Wallet, label: "Earnings" },
  { icon: MessageCircle, label: "Messages" },
  { icon: BadgeCheck, label: "Accounts" },
] as const;

type TabLabel = (typeof TABS)[number]["label"];

export function HeroDemo() {
  const [active, setActive] = useState<TabLabel>("Analytics");

  return (
    <BrowserFrame
      url="oncameraugc.com/dashboard"
      tabs={TABS.map((t) => ({ ...t, active: t.label === active }))}
      onSelect={(label) => setActive(label as TabLabel)}
    >
      {/* fixed height so the window does not jump when the panel changes */}
      <div key={active} className="ko-panel min-h-[26rem] sm:min-h-[29rem]">
        {active === "Analytics" && <Analytics />}
        {active === "Campaigns" && <Campaigns />}
        {active === "Earnings" && <Earnings />}
        {active === "Messages" && <Messages />}
        {active === "Accounts" && <Accounts />}
      </div>
    </BrowserFrame>
  );
}

function PanelHead({ title, right }: { title: string; right: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <p className="text-lg font-semibold">{title}</p>
      {right}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <li className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] px-4 py-3.5">{children}</li>;
}

function Analytics() {
  return (
    <>
      <PanelHead title="Analytics" right={<Chip>Last 7 days</Chip>} />
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile label="Active campaigns" value={<CountUp to={2} />} />
        <StatTile label="Earned" value={<>$<CountUp to={2578} /></>} />
        <StatTile label="Pending" value={<>$<CountUp to={1847} /></>} accent />
      </div>
      <AnalyticsPanel />
    </>
  );
}

const CAMPAIGNS: [string, string, string, "good" | "accent"][] = [
  ["Luma Skincare", "TikTok · 3 videos", "Active", "good"],
  ["Fieldhouse Coffee", "Instagram · 2 reels", "Post submitted", "accent"],
  ["Brightside Tea", "YouTube Shorts · 1 video", "Active", "good"],
];

function Campaigns() {
  return (
    <>
      <PanelHead title="Campaigns" right={<Chip>2 active</Chip>} />
      <ul className="flex flex-col gap-2.5">
        {CAMPAIGNS.map(([name, meta, status, tone]) => (
          <Row key={name}>
            <span>
              <span className="font-semibold">{name}</span>
              <span className="block text-xs text-[#a39e98]">{meta}</span>
            </span>
            <Chip tone={tone}>{status}</Chip>
          </Row>
        ))}
      </ul>
    </>
  );
}

const PAYMENTS: [string, string, number, boolean][] = [
  ["Luma Skincare", "Jun 24", 1240, true],
  ["Fieldhouse Coffee", "Jun 18", 1200, false],
  ["Brightside Tea", "Jun 10", 850, true],
  ["Oak & Ember", "Jun 6", 647, false],
  ["Pale Moon Beauty", "Jun 2", 488, true],
];

function Earnings() {
  return (
    <>
      <PanelHead title="Earnings" right={<Chip>$2,578 earned</Chip>} />
      <ul className="flex flex-col gap-2">
        {PAYMENTS.map(([name, date, amount, paid]) => (
          <Row key={name}>
            <span>
              <span className="font-semibold">{name}</span>
              <span className="block text-xs text-[#a39e98]">{date}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="font-bold tabular-nums">${amount.toLocaleString("en-US")}</span>
              <Chip tone={paid ? "good" : "accent"}>{paid ? "Paid" : "Pending"}</Chip>
            </span>
          </Row>
        ))}
      </ul>
    </>
  );
}

/** [from, text] — "them" is the brand, "me" is the creator. */
const CHAT: ["them" | "me", string][] = [
  ["them", "Hi! Loved your skincare video 💕"],
  ["me", "Thank you! So glad it performed well"],
  ["them", "Would you do 3 more for our summer launch?"],
];

function Messages() {
  // how many messages are showing; the dots show while the next one is on its way
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = CHAT.map((_, i) => setTimeout(() => setShown(i + 1), reduced ? 0 : 700 + i * 1500));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      <div className="mb-4 flex items-center gap-3 border-b border-white/[0.07] pb-4">
        <span className="grid size-9 place-items-center rounded-full bg-[#ac0216]/15 text-sm font-bold text-[#e0556a]">L</span>
        <span>
          <span className="block font-semibold leading-tight">Luma Skincare</span>
          <span className="text-xs text-emerald-300">● online</span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5 text-sm">
        {CHAT.slice(0, shown).map(([from, text]) => (
          <p
            key={text}
            className={cn(
              "ko-panel max-w-[80%] rounded-2xl px-4 py-2.5",
              from === "me" ? "self-end bg-[#ac0216] text-white" : "self-start bg-white/[0.07]",
            )}
          >
            {text}
          </p>
        ))}
        {shown < CHAT.length && (
          <span aria-hidden className="flex w-fit gap-1 self-start rounded-2xl bg-white/[0.07] px-4 py-3.5">
            {[0, 1, 2].map((d) => (
              <span key={d} style={{ animationDelay: `${d * 0.15}s` }} className="size-1.5 animate-bounce rounded-full bg-[#a39e98]" />
            ))}
          </span>
        )}
      </div>
    </>
  );
}

function Accounts() {
  return (
    <>
      <PanelHead title="Accounts" right={<Chip tone="good">2 verified</Chip>} />
      <ul className="flex flex-col gap-2.5">
        {[
          ["TikTok", "@careercraft.ai", true],
          ["Instagram", "@careercraft.ai", true],
          ["YouTube", "@careercraft", false],
        ].map(([platform, handle, verified]) => (
          <Row key={platform as string}>
            <span className="font-semibold">
              {platform} <span className="font-normal text-[#a39e98]">{handle}</span>
            </span>
            {verified ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-300">
                <BadgeCheck className="size-4" /> Verified
              </span>
            ) : (
              <Chip tone="accent">Add code to bio</Chip>
            )}
          </Row>
        ))}
      </ul>
    </>
  );
}
