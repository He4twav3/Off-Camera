import type { Metadata } from "next";
import { BadgeCheck, BarChart3, Briefcase, Home as HomeIcon, LineChart, ShieldCheck, Store, Wallet } from "lucide-react";
import {
  BrowserFrame,
  Chip,
  CountUp,
  Faq,
  FeatureCard,
  Hero,
  SectionTitle,
  StatTile,
  StatsBand,
  Steps,
} from "@/components/kora/blocks";
import { AnalyticsPanel } from "@/components/kora/analytics";

export const metadata: Metadata = {
  title: { absolute: "OnCamera · Your UGC work, all in one place" },
  description:
    "Apply to brand campaigns, submit your posts and follow your views and earnings in one dashboard. Free to join.",
  alternates: { canonical: "/" },
};

const faqs: [string, string][] = [
  ["What does it cost?", "Creating an account is free."],
  [
    "Who can join?",
    "Anyone can create an account. We review every creator profile by hand before you can apply to campaigns.",
  ],
  [
    "How do verified accounts work?",
    "You add a short code to your bio, we check it, and the account is marked as verified so brands know it's really yours.",
  ],
  ["Which platforms are supported?", "TikTok, Instagram and YouTube Shorts."],
  [
    "How are my views tracked?",
    "When you submit your post, we count its views and keep updating them every day. You'll see the numbers on your campaign.",
  ],
];

/** Creators page. The numbers inside the example windows are labelled
 * "Example data" and aren't real results. */
export default function CreatorsPage() {
  return (
    <>
      <Hero
        line1="Your UGC work,"
        line2="all in one place"
        sub="Apply to brand campaigns, submit your posts, and follow your views and earnings in one dashboard."
        cta={{ href: "/create-account", label: "Get started" }}
        note="Free to join. Every creator is hand-reviewed."
      >
        <BrowserFrame
          url="oncameraugc.com/dashboard"
          tabs={[
            { icon: HomeIcon, label: "Home" },
            { icon: BarChart3, label: "Analytics", active: true },
            { icon: Briefcase, label: "Campaigns" },
            { icon: Wallet, label: "Earnings" },
            { icon: BadgeCheck, label: "Accounts" },
          ]}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-semibold">Analytics</p>
            <Chip>Last 7 days</Chip>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatTile label="Active campaigns" value={<CountUp to={2} />} />
            <StatTile label="Earned" value={<>$<CountUp to={2578} /></>} />
            <StatTile label="Pending" value={<>$<CountUp to={1847} /></>} accent />
          </div>
          <AnalyticsPanel />
        </BrowserFrame>
      </Hero>

      <section id="features" className="mx-auto mt-24 max-w-[1100px] scroll-mt-28 px-5">
        <SectionTitle
          title="Everything for your UGC work, in one workspace"
          sub="No more tabs, screenshots and spreadsheets."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 md:grid-cols-5">
          <FeatureCard
            className="md:col-span-3"
            icon={LineChart}
            tone="crimson"
            title="Every campaign, tracked"
            body="Deliverables, status and what you're owed on every campaign."
          >
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                Posts in progress <Chip tone="good">Active</Chip>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                Waiting on review <Chip tone="accent">Post submitted</Chip>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                <span className="text-[#a39e98]">Deliverables</span>
                <span className="flex gap-1.5">
                  {[0, 0.6, 1.2].map((d) => (
                    <span key={d} style={{ animationDelay: `${d}s` }} className="ko-dot size-4 rounded-full border-2" />
                  ))}
                </span>
              </div>
              <div className="rounded-lg bg-[#1d1c22] px-3 py-3">
                <div className="mb-2 flex justify-between text-xs text-[#a39e98]">
                  <span>$1,240 paid</span>
                  <span>$480 pending</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#2d2b32]">
                  <span className="ko-fill block h-full rounded-full bg-[#ac0216]" />
                </div>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-2"
            delay={80}
            icon={ShieldCheck}
            tone="panel"
            title="Verified accounts"
            body="Prove each handle is yours so brands know who they are working with."
          >
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">TikTok <span className="font-normal text-[#a39e98]">@yourhandle</span></span>
                <span className="ko-pop inline-flex items-center gap-1 font-semibold text-emerald-300">
                  <BadgeCheck className="size-4" /> Verified
                </span>
              </div>
              <div className="rounded-lg bg-[#1d1c22] px-3 py-2.5">
                <p className="text-xs text-[#a39e98]">Add this to your bio</p>
                <p className="mt-1 font-mono font-semibold tracking-wide">oncamera-6C4253</p>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-2"
            delay={80}
            icon={Wallet}
            tone="panel"
            title="See your earnings build"
            body="Pending and paid, per campaign, so you always know where you stand."
          >
            <p className="text-4xl font-bold tabular-nums">$<CountUp to={1240} /></p>
            <p className="text-xs text-[#a39e98]">paid to date</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#2d2b32]">
              <span className="ko-fill block h-full rounded-full bg-[#ac0216]" style={{ "--ko-to": "72%" } as React.CSSProperties} />
            </div>
            <p className="mt-2 text-xs text-[#a39e98]">$480 pending</p>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-3"
            delay={160}
            icon={Store}
            tone="panel"
            title="A board of open campaigns"
            body="Browse campaigns from brands and apply in a click."
          >
            <ul className="flex flex-col gap-2 text-sm">
              {[
                ["3 videos", "TikTok", false, 0],
                ["2 reels", "Instagram", true, 0.5],
                ["1 video", "YouTube Shorts", false, 1],
              ].map(([name, meta, applied, d]) => (
                <li
                  key={name as string}
                  style={{ animationDelay: `${d}s` }}
                  className="ko-slide flex items-center justify-between gap-3 rounded-lg bg-[#1d1c22] px-3 py-2.5"
                >
                  <span>
                    <span className="font-semibold">{name}</span>
                    <span className="block text-xs text-[#a39e98]">{meta}</span>
                  </span>
                  {applied ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                      <BadgeCheck className="size-3.5" /> Applied
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[#e0556a]">Apply</span>
                  )}
                </li>
              ))}
            </ul>
          </FeatureCard>
        </div>
      </section>

      <StatsBand
        stats={[
          { value: <CountUp to={3} />, label: "platforms, one view" },
          { value: <><CountUp to={100} />%</>, label: "of creators hand-reviewed" },
          { value: <>$<CountUp to={0} /></>, label: "to join" },
        ]}
      />

      <Steps
        eyebrow="How it works"
        title="From sign-up to getting paid"
        steps={[
          ["Create your account", "Add your niche, the content you make and your social accounts."],
          ["Verify your accounts", "Put a short code in your bio so brands know your handles are really yours."],
          ["Apply, post and get paid", "Take on campaigns, submit your post, and follow your views and earnings."],
        ]}
      />

      <Faq title="Frequently asked questions" items={faqs} />
    </>
  );
}
