import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { LitWords } from "@/components/marketing/lit-words";
import { BEAT } from "@/components/marketing/motion";

export function HomeHero() {
  return (
    <section className="relative mx-auto max-w-[1240px] px-5 pt-32 pb-16 text-center sm:px-6 sm:pt-40 lg:px-8">
      <Reveal>
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-2 px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-crimson-bright" aria-hidden />
          The UGC agency for brands and creators
        </p>
      </Reveal>

      <Reveal delay={BEAT.title}>
        <LitWords
          as="h1"
          className="text-lit font-wordmark mx-auto mt-7 max-w-4xl text-[2.7rem] leading-[1.08] font-bold tracking-[-0.022em] text-balance sm:text-6xl md:text-[4.5rem] lg:text-[5rem]"
        >
          UGC that performs. Creators who deliver.
        </LitWords>
      </Reveal>

      <Reveal delay={BEAT.lede}>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
          We match brands with vetted creators, then track every post&rsquo;s
          views, so you can see what&rsquo;s working.
        </p>
      </Reveal>

      <Reveal delay={BEAT.body}>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/create-account?type=brand" />}
            className="btn-cta-glass h-12 rounded-full px-7 text-base font-bold text-cta-foreground"
          >
            I&rsquo;m a brand
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/create-account" />}
            className="h-12 rounded-full px-7 text-base font-bold"
          >
            I&rsquo;m a creator
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Free to join. No card required.
        </p>
      </Reveal>
    </section>
  );
}
