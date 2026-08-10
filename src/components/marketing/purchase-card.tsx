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

export function PurchaseCard() {
  return (
    <div id="pricing" className="card-sticker rounded-2xl bg-card p-6">
      <PriceTag variant="base">{siteConfig.price.formatted} one-time</PriceTag>
      <ul className="mt-5 space-y-2.5">
        {inclusions.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>
      <Button
        size="lg"
        nativeButton={false}
        render={<Link href="/checkout" />}
        className="btn-sticker mt-6 w-full"
      >
        Enroll now
      </Button>
    </div>
  );
}
