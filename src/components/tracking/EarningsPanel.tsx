import {
  CalendarDays,
  Clock,
  DollarSign,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { money } from "@/lib/fees";
import {
  averagePerPost,
  cycleHistory,
  moneyBar,
  payFor,
  type PostRowData,
  type PostTerms,
} from "@/lib/post-terms";
import { MoneyBar } from "@/components/tracking/TrackingHeader";
import { EmptyState } from "@/components/kit/ui";
import { cn } from "@/lib/utils";

const fmtDay = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";
const monthOf = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

function Cell({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Icon className={cn("size-5 shrink-0", tone)} />
      <div className="min-w-0">
        <p className="font-heading text-lg font-semibold tabular-nums text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const CHIP = {
  current: {
    label: "Current cycle",
    className: "bg-primary/15 text-primary",
    icon: CalendarDays,
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-amber-500/15 text-amber-500",
    icon: Clock,
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-500/15 text-emerald-500",
    icon: CheckCircle2,
  },
} as const;

/**
 * "Earnings": the numbers, where the money stands, and a history with one row per
 * payment cycle, grouped by month, newest first. US dollars throughout.
 */
export function EarningsPanel({
  terms,
  posts,
  paidTotal,
  viewer = "creator",
  now = new Date(),
}: {
  terms: PostTerms;
  posts: PostRowData[];
  paidTotal: number;
  viewer?: "creator" | "brand";
  now?: Date;
}) {
  const pay = payFor(terms, posts, now);
  const bar = moneyBar(pay, paidTotal);
  const history = cycleHistory(terms, posts, paidTotal, now);
  const current = history.find((h) => h.status === "current");

  const months = new Map<string, typeof history>();
  for (const h of history) {
    const m = monthOf(h.to);
    months.set(m, [...(months.get(m) ?? []), h]);
  }

  return (
    <section className="mt-5 flex flex-col gap-5">
      <dl className="grid grid-cols-1 divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card sm:grid-cols-2 sm:divide-y-0 [&>div:nth-child(n+3)]:sm:border-t [&>div:nth-child(n+3)]:border-border/70 [&>div:nth-child(odd)]:sm:border-r [&>div:nth-child(odd)]:border-border/70">
        <Cell
          icon={DollarSign}
          label={viewer === "brand" ? "Owed so far" : "Total earned"}
          value={money(pay.earned)}
          tone="text-emerald-500"
        />
        <Cell
          icon={CalendarDays}
          label="This cycle"
          value={money(current?.earned ?? 0)}
          tone="text-primary"
        />
        <Cell
          icon={Clock}
          label={viewer === "brand" ? "Due from you" : "Due, not paid yet"}
          value={money(bar.due)}
          tone="text-amber-500"
        />
        <Cell
          icon={BarChart3}
          label="Average per post"
          value={money(averagePerPost(pay))}
          tone="text-orange-500"
        />
      </dl>

      <div className="rounded-xl border border-border/70 bg-card px-5 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-heading text-base font-semibold text-foreground">
            Breakdown
          </h3>
          <p className="font-heading text-base font-semibold tabular-nums text-foreground">
            {money(pay.earned)}
          </p>
        </div>
        <MoneyBar {...bar} />
      </div>

      <div>
        <h3 className="mb-3 font-heading text-base font-semibold text-foreground">
          History
        </h3>
        {history.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            body="Your first payment cycle appears here once you add a post."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {[...months.entries()].map(([month, cycles]) => (
              <div key={month}>
                <div className="mb-2 flex items-baseline justify-between px-1 text-sm">
                  <span className="font-semibold text-foreground">{month}</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {money(cycles.reduce((n, c) => n + c.earned, 0))}
                  </span>
                </div>
                <ul className="flex flex-col gap-2">
                  {cycles.map((c) => {
                    const chip = CHIP[c.status];
                    return (
                      <li
                        key={c.cycle}
                        className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
                      >
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg",
                            chip.className,
                          )}
                        >
                          <chip.icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-foreground">
                            Cycle {c.cycle}
                            {c.status === "current" ? " (current)" : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fmtDay(c.from)} to {fmtDay(c.to)} · {c.posts}/
                            {terms.cycleSize} posts ·{" "}
                            {c.views.toLocaleString("en-US")} views
                          </p>
                        </div>
                        <p className="font-heading text-base font-semibold tabular-nums text-foreground">
                          +{money(c.earned)}
                        </p>
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-semibold",
                            chip.className,
                          )}
                        >
                          {chip.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
