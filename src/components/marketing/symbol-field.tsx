import { Camera, Clapperboard, Heart, Hash, MessageCircle, Mic, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = [Camera, Play, Hash, MessageCircle, Clapperboard, Heart, Mic, Sparkles];

function MarqueeRow({ reverse, offset }: { reverse?: boolean; offset?: number }) {
  // Icons duplicated once so translating -50% loops seamlessly.
  const items = [...ICONS, ...ICONS];
  return (
    <div
      className={cn(
        "animate-marquee flex w-max shrink-0 items-center gap-14 motion-reduce:animate-none",
        reverse && "[animation-direction:reverse]"
      )}
      style={offset ? { animationDelay: `-${offset}s` } : undefined}
    >
      {items.map((Icon, i) => (
        <Icon key={i} strokeWidth={1.5} className="size-9 shrink-0" />
      ))}
    </div>
  );
}

/**
 * Decorative, content-creation-themed icon field drifting slowly in the
 * background on a diagonal — depth without a gradient. Rendered once as a
 * viewport-fixed layer (see (marketing)/layout.tsx) so it reads top to
 * bottom at any scroll position instead of being confined to one section.
 * Purely decorative: aria-hidden, pointer-events-none, and low opacity so
 * it never competes with foreground text contrast.
 */
export function SymbolField({
  className,
  tone = "muted",
}: {
  className?: string;
  tone?: "muted" | "onPrimary";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 flex -rotate-6 scale-125 flex-col justify-around",
          tone === "onPrimary"
            ? "text-primary-foreground/10"
            : "text-foreground/[0.06]"
        )}
      >
        <MarqueeRow />
        <MarqueeRow reverse offset={12} />
        <MarqueeRow offset={5} />
        <MarqueeRow reverse offset={18} />
        <MarqueeRow offset={9} />
      </div>
    </div>
  );
}
