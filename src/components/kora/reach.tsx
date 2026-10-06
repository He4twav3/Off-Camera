/* eslint-disable @next/next/no-img-element */
import { Play } from "lucide-react";
import type { ProofReel } from "@/lib/proof-reel";
import { FadeIn } from "./fade-in";

/** Kora's "proven reach" block: a heading and a wall of real creator content
 * with its view counts. The totals and handles live in the page's dashboard
 * window above, so they aren't repeated here. */
export function ProvenReach({ reel }: { reel: ProofReel }) {
  const creators = reel.profiles;
  if (creators.length === 0 && reel.posts.length === 0) return null;

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

      {reel.posts.length > 0 && (
        <>
          <FadeIn className="mx-auto mt-16 max-w-2xl text-center">
            <p className="text-[0.75rem] font-bold tracking-[0.18em] text-[#e0556a] uppercase">Real creator content</p>
            <h3 className="mt-3 text-[clamp(1.5rem,3.4vw,2.2rem)] leading-[1.1] font-bold tracking-[-0.03em] text-balance">
              Content that stops the scroll
            </h3>
          </FadeIn>
          <ul className="-mx-5 mt-8 flex scroll-px-5 snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
            {reel.posts.map((p, i) => (
              <FadeIn key={p.id} delay={i * 70} className="w-[58%] shrink-0 snap-start sm:w-[36%] md:w-auto">
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
