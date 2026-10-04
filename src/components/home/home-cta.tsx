import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function HomeCTA() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pt-8 pb-28 text-center sm:px-6 lg:px-8">
      <Reveal>
        <h2 className="font-wordmark mx-auto max-w-2xl text-3xl leading-tight font-bold tracking-[-0.02em] text-balance sm:text-5xl">
          Get started in a minute
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
          Free to join, for creators and for brands.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      </Reveal>
    </section>
  );
}
