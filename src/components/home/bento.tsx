import { BadgeCheck, Clock3 } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { stagger } from "@/components/marketing/motion";
import { SectionHeader } from "@/components/marketing/section-frame";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { CountUp } from "./count-up";

/**
 * Four feature cards, each holding a small picture of the thing it describes
 * (the pattern UGC platforms like Kora use). Every number and name inside is
 * labelled "Example" — they illustrate the dashboards, they are not real
 * results. Motion is all driven by Reveal's `data-revealed` flag, so it plays
 * once as each card scrolls in, and by prefers-reduced-motion it just shows.
 */

const card = "flex h-full flex-col rounded-[14px] p-6 sm:p-7";
const example = (
  <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
    Example
  </span>
);

function CardCopy({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h3 className="font-heading text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">{body}</p>
    </>
  );
}

export function Bento() {
  const rows = [
    { who: "Creator A", where: "TikTok · Post submitted", views: 48210 },
    { who: "Creator B", where: "Instagram · In progress", views: 12904 },
    { who: "Creator C", where: "YouTube · Completed", views: 91377 },
  ];

  return (
    <section className="relative mx-auto max-w-[1240px] px-5 py-20 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="What you get"
        title="One place to run it, and to see it working"
        lede="Every creator, post and view in a dashboard, for brands and for creators."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-5">
        {/* Brands: campaign tracker */}
        <Reveal variant="lift" delay={stagger(0)} className="md:col-span-3">
          <SpotlightCard size={420} className={card}>
            <CardCopy
              title="Every creator, post and view in one place"
              body="See who&rsquo;s on each campaign, where they are, and how their post is performing."
            />
            <div className="mt-6 rounded-xl border border-hairline bg-surface-2 p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Your campaign</span>
                {example}
              </div>
              <ul className="divide-y divide-hairline">
                {rows.map((r) => (
                  <li key={r.who} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>
                      <span className="font-semibold text-foreground">{r.who}</span>
                      <span className="block text-xs text-muted-foreground">{r.where}</span>
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                      <CountUp to={r.views} />
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
          </SpotlightCard>
        </Reveal>

        {/* Creators: earnings */}
        <Reveal variant="lift" delay={stagger(1)} className="md:col-span-2">
          <SpotlightCard size={360} className={card}>
            <CardCopy
              title="See your earnings build"
              body="Pending and paid, per campaign, so you always know where you stand."
            />
            <div className="mt-6 rounded-xl border border-hairline bg-surface-2 p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Earnings</span>
                {example}
              </div>
              <p className="font-heading text-3xl font-semibold tabular-nums text-foreground">
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
          </SpotlightCard>
        </Reveal>

        {/* Verified accounts */}
        <Reveal variant="lift" delay={stagger(2)} className="md:col-span-2">
          <SpotlightCard size={360} className={card}>
            <CardCopy
              title="Accounts that are really theirs"
              body="Creators prove each handle is their own, so brands can trust who they&rsquo;re working with."
            />
            <div className="mt-6 rounded-xl border border-hairline bg-surface-2 p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Your accounts</span>
                {example}
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-foreground">
                  TikTok <span className="font-normal text-muted-foreground">@yourhandle</span>
                </span>
                <span
                  className="inline-flex origin-center scale-[1.7] items-center gap-1 text-sm font-semibold text-toy-soft-foreground opacity-0 transition-[transform,opacity] duration-500 ease-[var(--ease-cinematic)] [transition-delay:500ms] group-data-[revealed=true]/reveal:scale-100 group-data-[revealed=true]/reveal:opacity-100 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none"
                >
                  <BadgeCheck size={16} />
                  Verified
                </span>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Hand-reviewed */}
        <Reveal variant="lift" delay={stagger(3)} className="md:col-span-3">
          <SpotlightCard size={420} className={card}>
            <CardCopy
              title="Hand-reviewed on both sides"
              body="We approve every creator and every brand by hand before they start, so campaigns begin with people we&rsquo;ve actually vetted."
            />
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface-2 p-4 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 text-muted-foreground">
                <Clock3 size={14} />
                Under review
              </span>
              <span aria-hidden className="text-muted-foreground">→</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 text-muted-foreground transition-colors duration-500 [transition-delay:700ms] group-data-[revealed=true]/reveal:border-toy-soft-foreground/50 group-data-[revealed=true]/reveal:text-toy-soft-foreground motion-reduce:transition-none">
                <BadgeCheck size={14} />
                Approved
              </span>
              <span className="ml-auto">{example}</span>
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}
