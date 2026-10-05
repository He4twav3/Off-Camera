import { PLATFORM_COMMISSION_PERCENT } from "@/lib/commission";

/** Tells creators the commission up front. Renders nothing until one is set. */
export function CommissionNote({ className }: { className?: string }) {
  if (PLATFORM_COMMISSION_PERCENT === null) return null;
  return (
    <p className={`text-sm leading-relaxed text-muted-foreground ${className ?? ""}`}>
      OnCamera takes a <strong className="text-foreground">{PLATFORM_COMMISSION_PERCENT}%</strong> commission on each
      paid campaign, already taken out of the payout you&apos;re shown. You pay nothing if you aren&apos;t paid.
    </p>
  );
}
