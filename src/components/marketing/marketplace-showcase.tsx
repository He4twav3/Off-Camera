import { ProductCard } from "@/components/marketing/product-card";
import { CrestEmblem } from "@/components/illustrations/crest-emblem";
import { MascotChomp } from "@/components/illustrations/mascots";
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

      <div className="mx-auto mt-12 grid max-w-3xl items-start gap-8 sm:grid-cols-[1fr_auto]">
        <ProductCard
          className="mx-auto w-full max-w-sm"
          cover={
            <div className="flex size-full items-center justify-center bg-ink p-8">
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

        <div className="hidden w-24 sm:flex sm:justify-center sm:pt-10">
          <MascotChomp variant="strong" className="w-20" />
        </div>
      </div>
    </section>
  );
}
