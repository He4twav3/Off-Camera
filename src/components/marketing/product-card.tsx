import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PriceTag } from "@/components/marketing/price-tag";
import { cn } from "@/lib/utils";

export function ProductCard({
  cover,
  title,
  creatorName,
  creatorInitials,
  rating,
  reviewCount,
  price,
  priceVariant = "base",
  className,
}: {
  cover: ReactNode;
  title: string;
  creatorName: string;
  creatorInitials: string;
  rating: number;
  reviewCount: number;
  price: string;
  priceVariant?: "soft" | "base" | "strong" | "deep";
  className?: string;
}) {
  return (
    <div
      className={cn("card-sticker overflow-hidden rounded-2xl bg-card", className)}
    >
      <div className="aspect-video">{cover}</div>
      <div className="border-t-[3px] border-ink p-5">
        <h3 className="font-heading text-lg leading-snug font-semibold text-balance">
          {title}
        </h3>

        <div className="mt-3 flex items-center gap-2">
          <Avatar className="size-6 border-2 border-ink">
            <AvatarFallback className="bg-accent text-[10px] font-bold">
              {creatorInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium underline decoration-1 underline-offset-2">
            {creatorName}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-sm font-medium">
          <Star className="size-4 fill-ink text-ink" />
          {rating.toFixed(1)}
          <span className="text-muted-foreground">({reviewCount})</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <PriceTag variant={priceVariant}>{price}</PriceTag>
        </div>
      </div>
    </div>
  );
}
