import { BadgeCheck } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { stagger } from "@/components/marketing/motion";
import { CountUp } from "./count-up";

/**
 * Four plain cards, each holding a small picture of the thing it describes.
 * Every name and number inside is labelled "Example" — they illustrate the
 * dashboards, they are not real results. Motion is driven by Reveal's
 * `data-revealed` flag (plays once as a card scrolls in) and respects
 * prefers-reduced-motion.
 */

const card = "flex h-full flex-col rounded-2xl border border-hairline bg-surface-2 p-6 sm:p-7";
const tag = (
  <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
    Example
  </span>
);
const panel = "mt-6 rounded-xl border border-hairline bg-background/60 p-4";

function Copy({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h3 className="font-heading text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">{body}</p>
    </>
  );
}

export function Bento() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <h2 className="font-wordmark text-3xl leading-tight font-bold tracking-[-0.02em] text-balance sm:text-5xl">
            One workspace for every campaign
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Creators, posts, views and payouts together. No more tabs and spreadsheets.
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-5">
        {/* Brands: campaign tracker */}
        <Reveal variant="lift" delay={stagger(0)} className="md:col-span-3">
          <div className={card}>
            <Copy
              title="Every creator, post and view in one place"
              body="See who is on each campaign, where they are, and how their post is performing."
            />
            <div className={panel}>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Your campaign</span>
                {tag}
              </div>
              <ul className="divide-y divide-hairline">
                {[
                  ["Creator A", "TikTok · Post submitted", 48210],
                  ["Creator B", "Instagram · In progress", 12904],
                  ["Creator C", "YouTube · Completed", 91377],
                ].map(([who, where, views]) => (
                  <li key={who as string} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>
                      <span className="font-semibold text-foreground">{who}</span>
                      <span className="block text-xs text-muted-foreground">{where}</span>
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      <CountUp to={views as number} />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-hairline pt-3 text-right text-xs text-muted-foreground">
                Total{" "}
                <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                  <CountUp to={152491} duration={1800} />
                </span>{" "}
                views
              </p>
            </div>
          </div>
        </Reveal>

        {/* Creators: campaign board */}
        <Reveal variant="lift" delay={stagger(1)} className="md:col-span-2">
          <div className={card}>
            <Copy title="Campaigns, on one board" body="Browse open campaigns from brands and apply in a click." />
            <div className={panel}>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Open campaigns</span>
                {tag}
              </div>
              <ul className="flex flex-col gap-2">
                {[
                  ["Skincare UGC", "TikTok · 3 videos", false],
                  ["App launch", "Instagram · 2 reels", true],
                  ["Fitness gear", "YouTube Shorts · 1 video", false],
                ].map(([name, meta, applied]) => (
                  <li
                    key={name as string}
                    className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 text-sm"
                  >
                    <span>
                      <span className="font-semibold text-foreground">{name}</span>
                      <span className="block text-xs text-muted-foreground">{meta}</span>
                    </span>
                    {applied ? (
                      <span className="inline-flex origin-center scale-[1.5] items-center gap-1 text-xs font-semibold text-toy-soft-foreground opacity-0 transition-[transform,opacity] duration-500 ease-[var(--ease-cinematic)] [transition-delay:600ms] group-data-[revealed=true]/reveal:scale-100 group-data-[revealed=true]/reveal:opacity-100 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none">
                        <BadgeCheck size={14} /> Applied
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-crimson-bright">Apply</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* Creators: earnings */}
        <Reveal variant="lift" delay={stagger(2)} className="md:col-span-2">
          <div className={card}>
            <Copy title="See your earnings build" body="Pending and paid, per campaign, so you always know where you stand." />
            <div className={panel}>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Earnings</span>
                {tag}
              </div>
              <p className="font-heading text-3xl font-semibold tabular-nums">
                $<CountUp to={1240} />
              </p>
              <p className="text-xs text-muted-foreground">paid to date</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-3">
                <span
                  aria-hidden
                  className="block h-full w-0 rounded-full bg-gradient-to-r from-crimson-bright to-crimson transition-[width] duration-[1400ms] ease-[var(--ease-cinematic)] group-data-[revealed=true]/reveal:w-[72%] motion-reduce:w-[72%] motion-reduce:transition-none"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">$480 pending</p>
            </div>
          </div>
        </Reveal>

        {/* Verified accounts */}
        <Reveal variant="lift" delay={stagger(3)} className="md:col-span-3">
          <div className={card}>
            <Copy
              title="Accounts that are really theirs"
              body="Creators prove each handle is their own, so brands know exactly who they are working with."
            />
            <div className={panel}>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Your accounts</span>
                {tag}
              </div>
              {[
                ["TikTok", "@yourhandle", true],
                ["Instagram", "@yourhandle", false],
              ].map(([platform, handle, verified]) => (
                <div key={platform as string} className="flex items-center justify-between gap-3 border-t border-hairline py-2.5 text-sm first:border-t-0">
                  <span className="font-semibold text-foreground">
                    {platform} <span className="font-normal text-muted-foreground">{handle}</span>
                  </span>
                  {verified ? (
                    <span className="inline-flex origin-center scale-[1.7] items-center gap-1 text-sm font-semibold text-toy-soft-foreground opacity-0 transition-[transform,opacity] duration-500 ease-[var(--ease-cinematic)] [transition-delay:500ms] group-data-[revealed=true]/reveal:scale-100 group-data-[revealed=true]/reveal:opacity-100 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none">
                      <BadgeCheck size={16} /> Verified
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not verified</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
