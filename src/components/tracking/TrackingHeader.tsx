import { moneyBar, type PayTotals, type PostTerms } from "@/lib/post-terms";

const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const whole = (n: number) =>
  n % 1 === 0 ? `$${n.toLocaleString("en-US")}` : usd(n);

/** The three-part money bar: paid, due and still counting. Shared by the header and the Earnings tab. */
export function MoneyBar({
  paid,
  due,
  counting,
  total,
  compact = false,
}: {
  paid: number;
  due: number;
  counting: number;
  total: number;
  /** Just the bar, without the legend underneath. */
  compact?: boolean;
}) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div>
      <div
        className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Paid ${whole(paid)}, due ${whole(due)}, still counting ${whole(counting)}`}
      >
        <div className="bg-emerald-500" style={{ width: `${pct(paid)}%` }} />
        <div className="bg-amber-500" style={{ width: `${pct(due)}%` }} />
        <div className="bg-primary" style={{ width: `${pct(counting)}%` }} />
      </div>
      {!compact && (
        <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            Paid{" "}
            <span className="font-semibold text-foreground">{whole(paid)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            Due{" "}
            <span className="font-semibold text-foreground">{whole(due)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            Still counting{" "}
            <span className="font-semibold text-foreground">
              {whole(counting)}
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}

/**
 * The top of a joined campaign: total earned in US dollars, where the money stands, and
 * how far through the current payment cycle you are.
 */
export function TrackingHeader({
  terms,
  pay,
  paidTotal,
  viewer = "creator",
}: {
  terms: PostTerms;
  pay: PayTotals;
  paidTotal: number;
  viewer?: "creator" | "brand";
}) {
  const bar = moneyBar(pay, paidTotal);
  const inCycle = pay.counted % terms.cycleSize;
  const [dollars, cents] = usd(pay.earned).replace("$", "").split(".");

  return (
    <section className="mt-5 rounded-xl border border-border/70 bg-card px-5 py-5">
      <p className="text-sm text-muted-foreground">
        {viewer === "brand" ? "Owed to the creator so far" : "Total earned"}
      </p>
      <p className="mt-0.5 font-heading text-4xl font-semibold tabular-nums text-foreground">
        <span className="text-2xl text-muted-foreground">$</span>
        {dollars}
        <span className="text-2xl text-muted-foreground">.{cents}</span>
      </p>
      <div className="mt-4">
        <MoneyBar {...bar} />
      </div>
      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{inCycle}</span>/
          {terms.cycleSize} posts this cycle
        </span>
        <span>Paid every {terms.cycleSize} posts</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(inCycle / terms.cycleSize) * 100}%` }}
        />
      </div>
    </section>
  );
}
