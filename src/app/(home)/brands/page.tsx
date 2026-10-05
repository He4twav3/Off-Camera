import type { Metadata } from "next";
import { BadgeCheck, BarChart3, Eye, LayoutDashboard, LineChart, Megaphone, Rocket, ShieldCheck, Users } from "lucide-react";
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
import { ProvenReach, postName } from "@/components/kora/reach";
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

/** Brands page. The figures, accounts and posts shown are real: they come from
 * our own posts (lib/proof-reel.ts), with view counts shown as minimums. The
 * review list in the hero is a picture of how reviewing creators looks. */
export default async function BrandsPage() {
  const reel = await getProofReel();
  const top = reel.posts.slice(0, 3);
  const postsTotal = reel.posts.reduce((n, p) => n + p.viewsNum, 0);
  const avg = reel.posts.length ? Math.round(postsTotal / reel.posts.length) : 0;
  const hasProfiles = reel.profiles.length > 0;
  // A stated total is shown exactly; a sum of posts is a minimum, so it gets a "+".
  const plus = reel.totalIsStated ? "" : "+";
  const best = reel.posts[0];
  const topPlatform = [...reel.platformViews].sort((a, b) => b.views - a.views)[0];

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
          badge="Real posts"
          sidebar={[
            { icon: Megaphone, label: "Campaigns" },
            { icon: Users, label: "Creators", active: true },
            { icon: BarChart3, label: "Results" },
          ]}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold">{hasProfiles ? "Our creators" : "Our own content"}</p>
            <Chip tone="good">Live</Chip>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label={hasProfiles ? "Creators" : "Posts"}
              value={<CountUp to={Math.max(hasProfiles ? reel.profiles.length : reel.posts.length, 1)} />}
            />
            <StatTile label="Avg views" value={<><CountUp to={avg} compact />+</>} />
            <StatTile label="Total views" value={<><CountUp to={reel.totalViews} duration={2000} compact />{plus}</>} accent />
          </div>
          <ReviewList
            items={
              hasProfiles
                ? reel.profiles.map((c) => ({
                    id: c.handle + c.platform,
                    name: c.name,
                    meta: `@${c.handle} · ${c.platform} · ${c.views} views`,
                    thumbnail: c.avatar,
                  }))
                : reel.posts.map((p) => ({
                    id: p.id,
                    name: postName(p),
                    meta: `${p.platform} · ${p.views} views`,
                    thumbnail: p.thumbnail,
                  }))
            }
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
                <span className="font-semibold">TikTok <span className="font-normal text-[#a39e98]">@yourhandle</span></span>
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
            body="Every post's views, updated daily across TikTok, Instagram and YouTube."
          >
            <p className="text-4xl font-bold tabular-nums"><CountUp to={reel.totalViews} duration={2000} compact />{plus}</p>
            <p className="text-xs text-[#a39e98]">{reel.totalIsStated ? "views driven" : "views across our own posts"}</p>
            <div className="mt-4 flex flex-col gap-2">
              {reel.platformViews.map((x) => (
                <div key={x.platform} className="flex items-center gap-3 text-xs text-[#a39e98]">
                  <span className="w-16">{x.platform}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#2d2b32]">
                    <span className="ko-fill block h-full rounded-full bg-[#ac0216]" style={{ "--ko-to": `${Math.max(2, Math.round(x.share * 100))}%` } as React.CSSProperties} />
                  </span>
                </div>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-2"
            delay={80}
            icon={LineChart}
            title="Know what's working"
            body="See your best post, your average, and which platform delivers."
          >
            <ul className="flex flex-col gap-2 text-sm">
              {best && (
                <li className="flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                  <span className="text-[#a39e98]">Best post</span>
                  <span className="font-semibold tabular-nums">{compactViews(best.viewsNum)}+</span>
                </li>
              )}
              <li className="flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                <span className="text-[#a39e98]">Average per post</span>
                <span className="font-semibold tabular-nums">{compactViews(avg)}+</span>
              </li>
              {topPlatform && (
                <li className="flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                  <span className="text-[#a39e98]">Top platform</span>
                  <span className="font-semibold">{topPlatform.platform} · {Math.round(topPlatform.share * 100)}%</span>
                </li>
              )}
            </ul>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-2"
            delay={160}
            icon={LayoutDashboard}
            title="One dashboard"
            body="Your campaigns, the creators on each, their posts and where they are."
          >
            <ul className="flex flex-col gap-2 text-sm">
              {top.slice(0, 3).map((p, i) => (
                <li key={p.id} style={{ animationDelay: `${i * 0.5}s` }} className="ko-slide flex items-center justify-between rounded-lg bg-[#1d1c22] px-3 py-2.5">
                  <span className="font-semibold">{postName(p)}</span>
                  <span className="text-xs text-[#a39e98]">{p.views}</span>
                </li>
              ))}
            </ul>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-6"
            delay={80}
            icon={Rocket}
            title="We set it up with you"
            body="Share your brief and we set up the campaign and match the right creators. You don't have to chase anyone."
          >
            <ol className="grid gap-2 text-sm sm:grid-cols-3">
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
          { value: <>{compactViews(reel.totalViews)}{plus}</>, label: reel.totalIsStated ? "views driven" : "views on our own posts" },
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
