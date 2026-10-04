import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { TikTokIcon, InstagramIcon, YouTubeIcon } from "@/components/marketing/platform-icons";

export function HomeHero() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 pt-36 pb-12 text-center sm:px-6 sm:pt-44 lg:px-8">
      <Reveal>
        <h1 className="font-wordmark mx-auto max-w-3xl text-[2.6rem] leading-[1.06] font-bold tracking-[-0.025em] text-balance sm:text-6xl lg:text-[4.25rem]">
          UGC campaigns, without the chaos
        </h1>
      </Reveal>

      <Reveal delay={120}>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
          Brands find vetted creators and see every result. Creators find
          campaigns and keep every post, view and payment in one place.
        </p>
      </Reveal>

      <Reveal delay={220}>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/create-account" />}
            className="btn-cta-glass h-12 rounded-full px-8 text-base font-bold text-cta-foreground"
          >
            Get started
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/create-account?type=brand" />}
            className="h-12 rounded-full px-8 text-base font-bold"
          >
            For brands
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Free to join. Every creator hand-reviewed.</p>
      </Reveal>

      <Reveal delay={320}>
        <div className="mt-14 flex flex-col items-center gap-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Tracks views on
          </p>
          <ul className="flex items-center gap-7 text-foreground/80">
            <li className="flex items-center gap-2 text-sm font-semibold">
              <TikTokIcon className="size-5" /> TikTok
            </li>
            <li className="flex items-center gap-2 text-sm font-semibold">
              <InstagramIcon className="size-5" /> Instagram
            </li>
            <li className="flex items-center gap-2 text-sm font-semibold">
              <YouTubeIcon className="size-5" /> YouTube
            </li>
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
