import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/marketing/price-tag";
import { MetalButtonWrap } from "@/components/site/metal-button-wrap";
import { siteConfig } from "@/lib/site-config";

const inclusions = [
  "8 core modules, 25 lessons",
  "Pitch & contract templates",
  "Private student community",
  "Lifetime access + future updates",
  "Campaign application checklist",
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
          One plan. Everything included.
        </h2>
        <p className="mt-4 text-muted-foreground">
          No tiers to think about, just the full course, once.
        </p>
      </div>

      <div className="card-sticker mx-auto mt-12 max-w-md rounded-2xl bg-card p-6 sm:p-7">
        <span className="inline-flex items-center rounded-full border-2 border-ink bg-accent px-3 py-1 text-xs font-bold">
          {siteConfig.name} · Full Course
        </span>

        <div className="mt-5">
          <PriceTag variant="base">{siteConfig.price.formatted} one-time</PriceTag>
        </div>

        <ul className="mt-6 space-y-3">
          {inclusions.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
        <MetalButtonWrap className="mt-8 w-full">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/checkout" />}
            className="btn-sticker w-full"
          >
            Enroll now
          </Button>
        </MetalButtonWrap>
      </div>
    </section>
  );
}
