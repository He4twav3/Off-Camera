import { ProductCard } from "@/components/marketing/product-card";
import { CrestEmblem } from "@/components/illustrations/crest-emblem";
import { siteConfig } from "@/lib/site-config";

export function MarketplaceShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
          Built to travel, here or anywhere else
        </h2>
        <p className="mt-4 text-muted-foreground">
          This is the listing card, the exact way it&apos;ll look whether
          you find it here, on Whop, or on Gumroad.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-sm">
        <ProductCard
          className="w-full"
          cover={
            <div className="flex size-full items-center justify-center bg-background p-8">
              <CrestEmblem className="max-h-full max-w-[10rem]" />
            </div>
          }
          title="Off Camera: Faceless Content & Brand Deals"
          creatorName={siteConfig.creator.name}
          creatorInitials="AR"
          rating={4.9}
          reviewCount={127}
          price={siteConfig.price.formatted}
          priceVariant="base"
        />
      </div>
    </section>
  );
}
