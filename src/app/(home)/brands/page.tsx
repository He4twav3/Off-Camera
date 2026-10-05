import type { Metadata } from "next";
import { BadgeCheck, BarChart3, Eye, LayoutDashboard, Megaphone, Rocket, ShieldCheck, Users } from "lucide-react";
import {
  AtHandle,
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
import { ProvenReach } from "@/components/kora/reach";
import { ReviewList } from "@/components/kora/review-list";
import { compactViews } from "@/lib/format";
import { getProofReel } from "@/lib/proof-reel";

export const metadata: Metadata = {
  title: "For brands",
  description:
    "Run UGC campaigns with hand-reviewed creators and see every post's views in one dashboard. Free to create an account.",
  alternates: { canonical: "/brands" },
};

const faqs: [string, string][] = [
  ["How do I get started?", "Create a brand account. We review it by hand, then set up your first campaign with you."],
  ["What does it cost to join?", "Creating an account is free."],
  [
    "How do you choose creators?",
    "We review every creator by hand and verify their accounts before they can work on a campaign.",
  ],
  [
    "Can I see how content performs?",
    "Yes. Your dashboard shows each creator, their post and its views, updated every day.",
  ],
  ["Which platforms do you track?", "TikTok, Instagram and YouTube."],
];

/** Brands page. The creators shown are the accounts in lib/creators.ts and the
 * total is the stated one; the content wall uses real posts (lib/proof-reel.ts). */
export default async function BrandsPage() {
  const reel = await getProofReel();
  const creators = reel.profiles;
  const plus = reel.totalIsStated ? "" : "+";
  const avg = creators.length ? Math.round(reel.totalViews / creators.length) : 0;

  return (
    <>
      <Hero
        line1="Campaigns with creators"
        line2="you can trust"
        sub="Tell us what you need. We put hand-reviewed creators on your campaign and track every post."
        cta={{ href: "/create-account?type=brand", label: "Start a campaign" }}
        note="Free to create an account."
      >
        <BrowserFrame
          url="oncameraugc.com/brand"
          badge="Live"
          sidebar={[
            { icon: Megaphone, label: "Campaigns" },
            { icon: Users, label: "Creators", active: true },
            { icon: BarChart3, label: "Results" },
          ]}
        >
          <p className="mb-4 font-semibold">Our creators</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Creators" value={<CountUp to={Math.max(creators.length, 1)} />} />
            <StatTile label="Avg views" value={<><CountUp to={avg} compact />{plus}</>} />
            <StatTile label="Total views" value={<><CountUp to={reel.totalViews} duration={2000} compact />{plus}</>} accent />
          </div>
          <ReviewList
            items={creators.map((c) => ({
              id: c.handle,
              name: `@${c.handle}`,
              meta: `${compactViews(c.viewsNum)} views`,
            }))}
          />
        </BrowserFrame>
      </Hero>

      <ProvenReach reel={reel} />

      <section id="features" className="mx-auto mt-24 max-w-[1100px] scroll-mt-28 px-5">
        <SectionTitle
          title="What makes this work"
          sub="Vetted creators, results you can see, and a team that sets it up with you."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <FeatureCard
            className="md:col-span-3"
            icon={ShieldCheck}
            title="Hand-reviewed creators"
            body="Every creator is reviewed by our team before they can join a campaign."
          >
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                Creator profile <Chip>Under review</Chip>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                Accounts checked
                <span className="ko-pop inline-flex items-center gap-1 font-semibold text-emerald-300">
                  <BadgeCheck className="size-4" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                Ready for campaigns <Chip tone="good">Approved</Chip>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-3"
            delay={80}
            icon={BadgeCheck}
            title="Accounts that are really theirs"
            body="Creators prove each handle is their own with a short code in their bio, so you know who you are working with."
          >
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">@yourhandle</span>
                <span className="ko-pop inline-flex items-center gap-1 font-semibold text-emerald-300">
                  <BadgeCheck className="size-4" /> Verified
                </span>
              </div>
              <div className="rounded-lg bg-[#1d1c22] px-3 py-2.5">
                <p className="text-xs text-[#a39e98]">Code in their bio</p>
                <p className="mt-1 font-mono font-semibold tracking-wide">oncamera-6C4253</p>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-2"
            icon={Eye}
            title="Reach you can see"
            body="Every post's views, updated daily, rolled up per creator and per campaign."
          >
            <p className="text-4xl font-bold tabular-nums"><CountUp to={reel.totalViews} duration={2000} compact />{plus}</p>
            <p className="text-xs text-[#a39e98]">views driven across our creators</p>
            <div className="mt-4 flex flex-col gap-2">
              {creators.slice(0, 3).map((c, i) => (
                <div key={c.handle} className="flex items-center gap-3 text-xs text-[#a39e98]">
                  <span className="w-24 truncate"><AtHandle handle={c.handle} /></span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#2d2b32]">
                    <span
                      className="ko-fill block h-full rounded-full bg-[#ac0216]"
                      style={{ "--ko-to": `${Math.round((c.viewsNum / Math.max(...creators.map((x) => x.viewsNum))) * 100)}%`, animationDelay: `${i * 0.2}s` } as React.CSSProperties}
                    />
                  </span>
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-2"
            delay={80}
            icon={LayoutDashboard}
            title="One dashboard"
            body="Your campaigns, the creators on each, their posts and where they are."
          >
            <ul className="flex flex-col gap-2 text-sm">
              {creators.slice(0, 3).map((c, i) => (
                <li key={c.handle} style={{ animationDelay: `${i * 0.5}s` }} className="ko-slide flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                  <span className="font-semibold"><AtHandle handle={c.handle} /></span>
                  <span className="text-xs text-[#a39e98]">{compactViews(c.viewsNum)} views</span>
                </li>
              ))}
            </ul>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-2"
            delay={160}
            icon={Rocket}
            title="We set it up with you"
            body="Share your brief and we set up the campaign and match the right creators."
          >
            <ol className="flex flex-col gap-2 text-sm">
              {["Your brief", "Creators matched", "Campaign live"].map((s, i) => (
                <li key={s} className="flex items-center gap-3 rounded-lg bg-[#1d1c22] px-3 py-2.5">
                  <span style={{ animationDelay: `${i * 0.7}s` }} className="ko-dot size-4 rounded-full border-2" />
                  {s}
                </li>
              ))}
            </ol>
          </FeatureCard>
        </div>
      </section>

      <StatsBand
        stats={[
          { value: <>{compactViews(reel.totalViews)}{plus}</>, label: "views driven by our creators" },
          { value: <><CountUp to={100} />%</>, label: "of creators hand-reviewed" },
          { value: "Daily", label: "view updates" },
        ]}
      />

      <Steps
        eyebrow="The flow"
        title="From brief to results"
        steps={[
          ["Create your brand account", "Tell us about your company. We review new brands by hand."],
          ["We match creators to your campaign", "We set the campaign up with you and put verified creators on it."],
          ["Track every post", "See each creator, their post and its views as they come in."],
        ]}
      />

      <Faq title="Common questions" items={faqs} />
    </>
  );
}
