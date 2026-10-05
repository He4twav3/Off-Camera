/* eslint-disable @next/next/no-img-element */
import { Play } from "lucide-react";
import { compactViews } from "@/lib/format";
import type { ProofReel } from "@/lib/proof-reel";
import { AtHandle } from "./blocks";
import { CountUp } from "./count-up";
import { FadeIn } from "./fade-in";
import { cn } from "@/lib/utils";

/** Kora's "proven reach" block: a headline total with a few supporting figures,
 * the creators behind it, and a wall of their content with its view counts. */
export function ProvenReach({ reel }: { reel: ProofReel }) {
  const creators = reel.profiles;
  if (creators.length === 0 && reel.posts.length === 0) return null;
  const plus = reel.totalIsStated ? "" : "+";
  const avg = creators.length ? Math.round(reel.totalViews / creators.length) : 0;

  return (
    <section className="mx-auto mt-24 max-w-[1100px] px-5">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <p className="text-[0.75rem] font-bold tracking-[0.18em] text-[#e0556a] uppercase">Proven reach</p>
        <h2 className="mt-3 text-[clamp(1.9rem,4.6vw,3.1rem)] leading-[1.08] font-bold tracking-[-0.03em] text-balance">
          Views our creators have already driven
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-[#a39e98]">
          The reach across the creators we work with, and the content behind it.
        </p>
      </FadeIn>

      <FadeIn delay={80} className="mt-12">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3">
          {[
            { label: "Views driven", value: <><CountUp to={reel.totalViews} duration={2000} compact />{plus}</>, big: true },
            { label: "Creators", value: <CountUp to={creators.length} /> },
            { label: "Average per creator", value: <><CountUp to={avg} duration={1600} compact />{plus}</> },
          ].map((s) => (
            <div key={s.label} className="bg-[#1d1c22] px-6 py-7 text-center">
              <p className={cn("font-bold tracking-[-0.03em] tabular-nums", s.big ? "text-4xl text-[#e0556a]" : "text-3xl")}>{s.value}</p>
              <p className="mt-2 text-[0.7rem] font-bold tracking-[0.14em] text-[#a39e98] uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {creators.length > 0 && (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {creators.map((c, i) => (
            <FadeIn key={c.handle} delay={Math.min(i, 5) * 60}>
              <li className="flex list-none items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#1d1c22] px-5 py-4">
                <span className="min-w-0 truncate text-lg font-semibold tracking-[-0.01em]">
                  <AtHandle handle={c.handle} />
                </span>
                <span className="text-right">
                  <span className="block text-2xl font-bold tracking-[-0.02em] tabular-nums">{compactViews(c.viewsNum)}</span>
                  <span className="block text-[0.65rem] font-bold tracking-[0.12em] text-[#a39e98] uppercase">views</span>
                </span>
              </li>
            </FadeIn>
          ))}
        </ul>
      )}

      {reel.posts.length > 0 && (
        <>
          <FadeIn className="mx-auto mt-16 max-w-2xl text-center">
            <p className="text-[0.75rem] font-bold tracking-[0.18em] text-[#e0556a] uppercase">Real creator content</p>
            <h3 className="mt-3 text-[clamp(1.5rem,3.4vw,2.2rem)] leading-[1.1] font-bold tracking-[-0.03em] text-balance">
              Content that stops the scroll
            </h3>
          </FadeIn>
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
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
                    <span className="absolute inset-x-0 bottom-0 p-3.5 text-xl font-bold tracking-[-0.02em] tabular-nums">{p.views}</span>
                  </a>
                </li>
              </FadeIn>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
