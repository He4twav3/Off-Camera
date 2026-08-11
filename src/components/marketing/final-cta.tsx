import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SymbolField } from "@/components/marketing/symbol-field";

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="card-sticker relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground sm:py-20">
        <SymbolField tone="onPrimary" />
        <h2 className="text-sticker relative text-3xl font-semibold tracking-tight sm:text-4xl">
          Your face doesn&apos;t need to be the product.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/85">
          Start building a content system that works for brands and for you,
          without ever stepping in front of the camera.
        </p>
        <Button
          size="lg"
          variant="secondary"
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
