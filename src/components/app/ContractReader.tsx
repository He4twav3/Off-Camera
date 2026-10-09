import type { ContractSection } from "@/lib/contract";
import { formatDate } from "@/lib/utils";

/**
 * The full contract with the brand, for a creator who has joined: every specific, written out, so nothing about the
 * deal is hidden. It opens on a click and shows who the brand is, when the brand agreed, and when the creator did.
 */
export function ContractReader({
  brand,
  brandAgreedAt,
  creatorAgreedAt,
  sections,
}: {
  brand: string;
  brandAgreedAt: string;
  creatorAgreedAt: string | null;
  sections: ContractSection[];
}) {
  return (
    <details className="mt-8 rounded-xl border border-border/70 bg-card px-4 py-3 sm:px-5 sm:py-4">
      <summary className="cursor-pointer font-heading text-base font-semibold text-foreground">Your contract with {brand}</summary>
      <p className="mt-2 text-sm text-muted-foreground">
        {brand} agreed on {formatDate(brandAgreedAt)}.{creatorAgreedAt ? ` You agreed on ${formatDate(creatorAgreedAt)}.` : ""}
      </p>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {sections.map((s) => (
          <div key={s.heading}>
            <p className="font-semibold text-foreground">{s.heading}</p>
            {s.lines.map((l) => (
              <p key={l} className="mt-1">
                {l}
              </p>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}
