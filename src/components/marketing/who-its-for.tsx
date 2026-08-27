import { Users, Camera, TrendingDown } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { stagger, BEAT } from "@/components/marketing/motion";
import { SectionHeader } from "@/components/marketing/section-frame";

/**
 * The three things people talk themselves out of starting with.
 *
 * WHY THIS IS NOT A ROW OF CARDS. It was three cards in a three-column
 * grid, and so was the section immediately after it. Two consecutive
 * sections built from the identical component, with the identical
 * stagger, reads as the page running out of ideas — the reader cannot
 * tell you what is different about them because structurally nothing is.
 * One of the two had to stop being a card grid, and this is the one whose
 * content was never really card-shaped: these are not three features
 * sitting side by side, they are three claims being answered in turn.
 *
 * So it is a stack, one claim per row, read top to bottom. The claim is
 * set large and dim, in quotation marks — the tone this page uses for
 * things that are not true — and the answer lands underneath it in full
 * foreground, behind a short crimson rule.
 *
 * WHAT THIS DELIBERATELY IS NOT. One pass drew a red line straight
 * through each claim as it arrived. It was the obvious idea and it looked
 * cheap: an animated strikethrough is a word processor's gesture, not an
 * editorial one, and a 900ms line crawling across a sentence draws
 * attention to the effect instead of the argument. Another pass broke the
 * three claims into full-bleed alternating bands; that spread three short
 * paragraphs across three screens of scrolling and lost the sense of them
 * being one argument answered in sequence. The crimson rule that survived
 * is the mark this page already uses beside verified claims in the Story
 * section — so the accent means the same thing in both places rather than
 * acquiring a second, gimmicky job here.
 *
 * The staged arrival hangs off the shared Reveal's `data-revealed` hook
 * rather than its own observer — see reveal.tsx. One observer, one
 * rhythm, and every beat inside the row stays under the 500ms ceiling the
 * rest of the page holds to.
 */
const beliefs = [
  {
    icon: Users,
    belief: "I don't have a following.",
    rebuttal:
      "Neither did the videos above, when they were posted. Reach comes from the video, not your follower count.",
  },
  {
    icon: Camera,
    belief: "I've never made content before.",
    rebuttal:
      "This course starts from zero, on purpose. The system is the same whether it's your first video or your five-hundredth.",
  },
  {
    icon: TrendingDown,
    belief: "My videos don't get views.",
    rebuttal:
      "A weak hook kills a beautifully produced video. A strong hook can carry a raw, simple one. We teach the mechanics, not the polish.",
  },
];

export function WhoItsFor() {
  return (
    <section className="relative mx-auto max-w-[1240px] px-5 py-20 sm:px-6 lg:px-8">
      <SectionHeader
        index="02"
        eyebrow="What's actually stopping you"
        title="Maybe you don't need any of that"
        lede="These are the reasons people talk themselves out of starting. None of them are actually the thing that determines whether a video gets watched."
      />

      <ul className="mx-auto mt-16 max-w-3xl">
        {beliefs.map((b, i) => (
          <Reveal key={b.belief} delay={stagger(i)}>
            <li className="group/belief border-b border-hairline py-8 last:border-b-0">
              <div className="flex items-start gap-4 sm:gap-5">
                <span className="mt-1.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-hairline bg-gradient-to-b from-surface-3 to-surface-2 text-muted-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.09)] transition-colors duration-300 ease-[var(--ease-cinematic)] group-hover/belief:text-foreground">
                  <b.icon className="size-4" strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  {/* The claim. Dim, quoted, and left exactly as it is —
                      nothing is drawn through it. It is disproved by what
                      sits underneath, which is a stronger move than
                      decorating it. */}
                  <p className="text-xl leading-snug font-semibold text-balance text-muted-foreground/65 sm:text-[1.4rem]">
                    &ldquo;{b.belief}&rdquo;
                  </p>

                  {/* The answer, arriving just behind the claim. The rule
                      draws first and the sentence follows it — the same
                      order you would read them in. Both beats are short:
                      260ms and 300ms, against a row that has itself
                      finished arriving in 420ms. */}
                  <div className="mt-4 flex items-start gap-3">
                    <span
                      aria-hidden
                      className={[
                        "mt-2.5 h-px w-6 shrink-0 origin-left rounded-full bg-crimson-bright",
                        "scale-x-0 transition-transform duration-[260ms] ease-[var(--ease-cinematic)]",
                        "group-data-[revealed=true]/reveal:scale-x-100",
                        "motion-reduce:scale-x-100 motion-reduce:transition-none",
                      ].join(" ")}
                      style={{ transitionDelay: "180ms" }}
                    />
                    <p
                      className={[
                        "max-w-2xl text-[0.95rem] leading-relaxed text-foreground/90",
                        "translate-y-1 opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-cinematic)]",
                        "group-data-[revealed=true]/reveal:translate-y-0 group-data-[revealed=true]/reveal:opacity-100",
                        "motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
                      ].join(" ")}
                      style={{ transitionDelay: "300ms" }}
                    >
                      {b.rebuttal}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          </Reveal>
        ))}
      </ul>

      <Reveal delay={BEAT.body + BEAT.step * 4}>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          Every one of those was true of us too, right before the videos
          above.
        </p>
      </Reveal>
    </section>
  );
}
