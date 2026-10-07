import { termsChips, type PayoutTerms } from "@/lib/payout-terms";
import { cn } from "@/lib/utils";

/** A campaign's pay in one line of short labels: fixed fee, rate per views, bonuses, cap. */
export function PayStrip({
  terms,
  className,
}: {
  terms: PayoutTerms;
  className?: string;
}) {
  const chips = termsChips(terms);
  if (chips.length === 0) return null;
  return (
    <ul
      className={cn("flex flex-wrap gap-2", className)}
      aria-label="How this campaign pays"
    >
      {chips.map((c, i) => (
        <li
          key={c}
          className={cn(
            "rounded-md border px-3 py-1 text-sm font-semibold",
            i === 0
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border/70 bg-muted/50 text-foreground",
          )}
        >
          {c}
        </li>
      ))}
    </ul>
  );
}
