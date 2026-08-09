import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SymbolField } from "@/components/marketing/symbol-field";

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="card-sticker relative overflow-hidden rounded-3xl bg-card px-8 py-16 text-center sm:py-20">
        {/* A brighter, tighter glow than the page's own ambient gradient —
            this panel is the last stop before the price, it should feel
            like the brightest pool of liquid metal on the page, not
            another flat dark card. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 0%, oklch(1 0 0 / 12%), transparent 65%)",
          }}
        />
        <SymbolField />
        <h2 className="text-sticker relative text-3xl font-semibold tracking-tight sm:text-4xl">
          Your face doesn&apos;t need to be the product.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
          Start building a content system that works for brands and for you,
          without ever stepping in front of the camera.
        </p>
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="#pricing" />}
          className="btn-sticker relative mt-8"
        >
          Enroll now
        </Button>
      </div>
    </section>
  );
}
