import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

/**
 * The app design kit. Admin, brand and creator pages are built from these so they all look
 * and behave the same: a header with the numbers that matter, tabs with counts,
 * dense rows, and details that open only when needed.
 *
 * All server components with no client state: tabs are links (?tab=...), and
 * "open details" is a native <details>, so nothing here needs JavaScript.
 */

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  summary,
  actions,
}: {
  title: string;
  summary?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {summary && (
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

/** A number with a label. `attention` makes it the accent colour: something is waiting. */
export function Stat({
  label,
  value,
  attention,
  hint,
}: {
  label: string;
  value: string;
  attention?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-4 py-3.5">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-2xl font-semibold tabular-nums",
          attention ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 [&>div]:min-w-0">
      {children}
    </dl>
  );
}

export type TabItem = {
  key: string;
  label: string;
  count: number;
  href: string;
  attention?: boolean;
};

/** Tabs with counts. A tab that needs attention gets a dot, so you never have to open each to find out. */
export function Tabs({ items, active }: { items: TabItem[]; active: string }) {
  return (
    <nav
      aria-label="Sections"
      className="mb-5 flex gap-1 overflow-x-auto border-b border-border/70 pb-px"
    >
      {items.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "relative -mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-1.5 py-2.5 text-[13px] font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm",
              on
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span
              className={cn(
                "min-w-5 rounded-md px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums",
                t.attention && t.count > 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {t.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** A list of rows inside one bordered panel, like a table without the table. */
export function RowList({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card">
      {children}
    </ul>
  );
}

export function Initial({ name }: { name: string }) {
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
    >
      {letter}
    </span>
  );
}

/**
 * One row: who/what on the left, status in the middle, the number that matters on
 * the right. Optional `details` open underneath without leaving the page.
 */
export function Row({
  leading,
  title,
  meta,
  status,
  statusTone = "neutral",
  figure,
  figureLabel,
  figureNote,
  details,
  detailsLabel = "Details",
  defaultOpen,
}: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  status?: string;
  statusTone?: StatusTone;
  figure?: string;
  figureLabel?: string;
  figureNote?: ReactNode;
  details?: ReactNode;
  detailsLabel?: string;
  defaultOpen?: boolean;
}) {
  const head = (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
      {leading}
      <div className="min-w-0 flex-1 basis-56">
        <p className="truncate text-[15px] font-semibold text-foreground">
          {title}
        </p>
        {meta && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {meta}
          </p>
        )}
      </div>
      {status && <StatusBadge tone={statusTone}>{status}</StatusBadge>}
      {figure && (
        <div className="ml-auto min-w-24 text-right">
          {figureLabel && (
            <p className="text-xs text-muted-foreground">{figureLabel}</p>
          )}
          <p className="font-heading text-lg font-semibold tabular-nums text-foreground">
            {figure}
          </p>
          {figureNote && (
            <p className="text-xs text-muted-foreground">{figureNote}</p>
          )}
        </div>
      )}
    </div>
  );

  if (!details) return <li>{head}</li>;

  return (
    <li>
      <details className="group" open={defaultOpen}>
        <summary className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden hover:bg-muted/30">
          <div className="min-w-0 flex-1">{head}</div>
          <span className="mr-4 hidden shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground sm:flex">
            {detailsLabel}
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </span>
          <ChevronDown className="mr-4 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 sm:hidden" />
        </summary>
        <div className="border-t border-border/70 bg-muted/20 px-4 py-4">
          {details}
        </div>
      </details>
    </li>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <p className="font-heading text-lg font-semibold text-foreground">
        {title}
      </p>
      {body && (
        <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">
          {body}
        </p>
      )}
    </div>
  );
}

/** Label and value pairs inside an open row. */
export function Facts({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {i.label}
          </dt>
          <dd className="mt-0.5 break-words text-foreground">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A small notice inside a row. */
export function Notice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "warn";
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "rounded-lg px-3.5 py-2.5 text-sm",
        tone === "warn"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}
