import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The admin's plain data tables: scrolls sideways on a phone, numbers line up on the right. */
export function Table({ children, min = "40rem" }: { children: ReactNode; min?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
      <table className="w-full text-left text-sm" style={{ minWidth: min }}>
        {children}
      </table>
    </div>
  );
}

export function Head({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border/70 text-xs text-muted-foreground">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, right, className }: { children?: ReactNode; right?: boolean; className?: string }) {
  return <th className={cn("px-3 py-2.5 font-medium first:pl-4 last:pr-4", right && "text-right", className)}>{children}</th>;
}

export function Body({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border/70">{children}</tbody>;
}

export function Td({ children, right, muted, className }: { children?: ReactNode; right?: boolean; muted?: boolean; className?: string }) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 align-top first:pl-4 last:pr-4",
        right && "text-right tabular-nums",
        muted && "text-muted-foreground",
        className,
      )}
    >
      {children}
    </td>
  );
}

/** A figure strip instead of boxes: label above, number below, all on one quiet line. */
export function Figures({ items }: { items: { label: string; value: string; hint?: string; attention?: boolean }[] }) {
  return (
    <dl className="mb-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-border/70 py-4">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs text-muted-foreground">{i.label}</dt>
          <dd className={cn("font-heading text-xl font-semibold tabular-nums", i.attention ? "text-primary" : "text-foreground")}>{i.value}</dd>
          {i.hint && <dd className="text-xs text-muted-foreground">{i.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 mt-10 flex items-end justify-between gap-3 first:mt-0">
      <h2 className="font-heading text-lg font-semibold text-foreground">{children}</h2>
      {aside}
    </div>
  );
}
