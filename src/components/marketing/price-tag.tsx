import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  soft: { fill: "var(--toy-soft)", text: "text-toy-soft-foreground" },
  base: { fill: "var(--toy-base)", text: "text-toy-base-foreground" },
  strong: { fill: "var(--toy-strong)", text: "text-toy-strong-foreground" },
  deep: { fill: "var(--toy-deep)", text: "text-toy-deep-foreground" },
} as const;

/**
 * The notched "price flag" shape — built as an SVG polygon (not CSS
 * clip-path) so the ink stroke traces the full outline, including the
 * diagonal notch. `vector-effect="non-scaling-stroke"` keeps the stroke a
 * constant pixel width even though the polygon stretches non-uniformly to
 * fill the box.
 */
export function PriceTag({
  children,
  variant = "base",
  className,
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const { fill, text } = VARIANTS[variant];

  return (
    <span className={cn("relative inline-flex h-11 items-center", className)}>
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polygon
          points="0,0 100,0 84,50 100,100 0,100"
          fill={fill}
          stroke="var(--ink)"
          strokeWidth={3}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className={cn(
          "relative z-10 py-1.5 pl-4 pr-8 font-heading text-lg font-bold whitespace-nowrap",
          text
        )}
      >
        {children}
      </span>
    </span>
  );
}
