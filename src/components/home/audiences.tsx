import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { stagger } from "@/components/marketing/motion";
import { SectionHeader } from "@/components/marketing/section-frame";
import { SpotlightCard } from "@/components/marketing/spotlight-card";

const tracks = [
  {
    id: "brands",
    label: "For brands",
    title: "Run campaigns with creators we’ve vetted",
    steps: [
      ["Create a brand account", "Tell us about your company. We review and approve new brands by hand."],
      ["We put creators on your campaign", "We set the campaign up with you and match verified creators to it."],
      ["Track every post", "Your dashboard shows each creator, their post and its views as they come in."],
    ],
    cta: { href: "/create-account?type=brand", text: "Create a brand account", primary: true },
  },
  {
    id: "creators",
    label: "For creators",
    title: "Get matched with brands and see what you earn",
    steps: [
      ["Join and tell us about your content", "Add your niche, the content you make and your social accounts."],
      ["Verify your accounts", "Prove your handles are yours so brands can trust them."],
      ["Apply, post, get paid", "Take on campaigns, submit your post, and follow your views and earnings in one dashboard."],
    ],
    cta: { href: "/create-account", text: "Join as a creator", primary: false },
  },
] as const;

export function Audiences() {
  return (
    <section id="how-it-works" className="relative scroll-mt-20 mx-auto max-w-[1240px] px-5 py-20 sm:px-6 lg:px-8 lg:scroll-mt-32">
      <SectionHeader
        eyebrow="How it works"
        title="Three steps, whichever side you&rsquo;re on"
        lede="Brands and creators each get a dashboard built for them."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {tracks.map((t, i) => (
          <Reveal key={t.id} variant="lift" delay={stagger(i)}>
            <SpotlightCard size={420} className="flex h-full flex-col rounded-[14px] p-7 sm:p-8">
              <div id={t.id} className="scroll-mt-28" />
              <p className="text-xs font-semibold tracking-[0.14em] text-crimson-bright uppercase">{t.label}</p>
              <h3 className="mt-3 font-heading text-2xl font-semibold text-foreground text-balance">
                {t.title}
              </h3>
              <ol className="mt-6 flex flex-col gap-5">
                {t.steps.map(([head, body], n) => (
                  <li key={head} className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-hairline-strong bg-surface-2 font-mono text-xs font-bold text-foreground tabular-nums">
                      {String(n + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold text-foreground">{head}</span>
                      <span className="mt-0.5 block text-[15px] leading-relaxed text-muted-foreground">{body}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-8 flex-1" />
              <Button
                size="lg"
                variant={t.cta.primary ? "default" : "outline"}
                nativeButton={false}
                render={<Link href={t.cta.href} />}
                className={
                  t.cta.primary
                    ? "btn-cta-glass h-11 w-full rounded-full font-bold text-cta-foreground sm:w-fit sm:px-6"
                    : "h-11 w-full rounded-full font-bold sm:w-fit sm:px-6"
                }
              >
                {t.cta.text}
                <ArrowRight className="size-4" />
              </Button>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>

      {/* The course, as a creator perk rather than the headline product. */}
      <Reveal delay={stagger(2)}>
        <p className="mx-auto mt-10 flex max-w-xl items-start justify-center gap-2 text-center text-sm text-muted-foreground">
          <Check className="mt-0.5 size-4 shrink-0 text-toy-soft-foreground" />
          <span>
            New to UGC? Creators complete our free course before applying to campaigns.{" "}
            <Link href="/course" className="font-semibold text-foreground underline underline-offset-2">
              See the course
            </Link>
            .
          </span>
        </p>
      </Reveal>
    </section>
  );
}
