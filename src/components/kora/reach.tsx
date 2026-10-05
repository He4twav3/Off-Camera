/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight, Play } from "lucide-react";
import { compactViews } from "@/lib/format";
import type { ProofReel, ReelPost } from "@/lib/proof-reel";
import { CountUp } from "./count-up";
import { FadeIn } from "./fade-in";
import { cn } from "@/lib/utils";

export const postName = (p: ReelPost) => (p.handle ? `@${p.handle}` : `${p.platform} post`);

/** Kora's "proven reach" block, built from our real posts: a big total, a few
 * supporting figures, and the posts themselves with their real view counts. */
export function ProvenReach({ reel }: { reel: ProofReel }) {
  if (reel.posts.length === 0) return null;
  const best = reel.posts[0];
  const postsTotal = reel.posts.reduce((n, p) => n + p.viewsNum, 0);
  const avg = Math.round(postsTotal / reel.posts.length);
  const handles = new Set(reel.posts.map((p) => p.handle).filter(Boolean));

  return (
    <section className="mx-auto mt-24 max-w-[1100px] px-5">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <p className="text-[0.75rem] font-bold tracking-[0.18em] text-[#e0556a] uppercase">Proven reach</p>
        <h2 className="mt-3 text-[clamp(1.9rem,4.6vw,3.1rem)] leading-[1.08] font-bold tracking-[-0.03em] text-balance">
          Views we&rsquo;ve already driven
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[#a39e98]">
          {reel.profiles.length > 0
            ? "Real creators and real posts, with the view counts they actually earned."
            : "Real posts from our own accounts, with the view counts they actually earned."}
        </p>
      </FadeIn>

      <FadeIn delay={80} className="mt-12">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-4">
          {[
            { label: "Total views", value: <><CountUp to={reel.totalViews} duration={2000} compact />{reel.totalIsStated ? "" : "+"}</>, big: true },
            { label: "Posts tracked", value: <CountUp to={reel.posts.length} /> },
            { label: "Average per post", value: <><CountUp to={avg} duration={1600} compact />+</> },
            { label: "Best post", value: `${compactViews(best.viewsNum)}+` },
          ].map((s) => (
            <div key={s.label} className="bg-[#1d1c22] px-6 py-7 text-center">
              <p className={cn("font-bold tracking-[-0.03em] tabular-nums", s.big ? "text-4xl text-[#e0556a]" : "text-3xl")}>{s.value}</p>
              <p className="mt-2 text-[0.7rem] font-bold tracking-[0.14em] text-[#a39e98] uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {reel.profiles.length > 0 && (
        <FadeIn delay={110} className="mt-4">
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {reel.profiles.map((c) => {
              const inner = (
                <>
                  <img src={c.avatar} alt={c.name} loading="lazy" className="size-16 shrink-0 rounded-full border border-white/[0.1] object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-semibold tracking-[-0.01em]">{c.name}</span>
                    <span className="block truncate text-sm text-[#a39e98]">
                      @{c.handle} · {c.platform}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-2xl font-bold tracking-[-0.02em] tabular-nums">{c.views}</span>
                    <span className="block text-[0.65rem] font-bold tracking-[0.12em] text-[#a39e98] uppercase">views</span>
                  </span>
                </>
              );
              const cls = "flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#1d1c22] p-4 transition-colors";
              return (
                <li key={c.handle + c.platform} className="list-none">
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className={cn(cls, "hover:bg-[#201f25]")}>
                      {inner}
                    </a>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </FadeIn>
      )}

      <FadeIn delay={140} className="mt-4">
        <div className="rounded-3xl border border-white/[0.08] bg-[#1d1c22] p-6">
          <p className="text-[0.7rem] font-bold tracking-[0.14em] text-[#a39e98] uppercase">
            Where the views come from{reel.totalIsStated ? " (across the posts shown below)" : ""}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {reel.platformViews.map((x) => (
              <div key={x.platform} className="flex items-center gap-4 text-sm">
                <span className="w-20 text-[#a39e98]">{x.platform}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#2d2b32]">
                  <span
                    className="ko-fill block h-full rounded-full bg-[#ac0216]"
                    style={{ "--ko-to": `${Math.max(2, Math.round(x.share * 100))}%` } as React.CSSProperties}
                  />
                </span>
                <span className="w-24 text-right font-semibold tabular-nums">
                  {compactViews(x.views)}+ <span className="font-normal text-[#a39e98]">({Math.round(x.share * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-[#a39e98]">
            {handles.size > 0 ? `Posted from ${[...handles].map((h) => `@${h}`).join(", ")}${reel.posts.some((p) => !p.handle) ? " and Instagram" : ""}. ` : ""}
            View counts are the totals at the time of writing, shown as minimums.
          </p>
        </div>
      </FadeIn>

      <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
        {reel.posts.map((p, i) => (
          <FadeIn key={p.id} delay={i * 70}>
            <li className="list-none">
              <a
                href={p.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-[9/16] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1d1c22] transition-transform duration-300 hover:-translate-y-1"
              >
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[#a39e98]">
                    <Play className="size-8" />
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <span className="absolute top-3 right-3 rounded-full bg-black/55 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  <ArrowUpRight className="size-3.5" />
                </span>
                <span className="absolute inset-x-0 bottom-0 p-3.5">
                  <span className="block text-xl font-bold tracking-[-0.02em] tabular-nums">{p.views}</span>
                  <span className="block truncate text-xs text-[#edeae4]/75">
                    {postName(p)} · {p.platform}
                  </span>
                </span>
              </a>
            </li>
          </FadeIn>
        ))}
      </ul>
    </section>
  );
}
