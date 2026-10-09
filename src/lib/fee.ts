/**
 * OnCamera's fee for a campaign, set per brand contract: a percentage on top of what creators earn, in bands of the
 * campaign's cumulative creator pay (each rate applies only to the pay inside its band, like tax brackets). Pure (no
 * server imports) so admin's pages, the issue-statement form and the tests all work it out the same way.
 *
 * Example: [{ upTo: 5000, percent: 25 }, { upTo: 20000, percent: 20 }, { upTo: null, percent: 15 }]
 *   creators earn $1,000 first  -> fee $250
 *   creators earn $6,000 in all -> fee 25% of $5,000 + 20% of $1,000 = $1,450
 */
export type FeeBand = { upTo: number | null; percent: number };

const cents = (n: number) => Math.round(n * 100) / 100;

/** Sorted lowest first, with the open-ended band last. */
function ordered(bands: FeeBand[]): FeeBand[] {
  return [...bands].sort((a, b) => (a.upTo ?? Infinity) - (b.upTo ?? Infinity));
}

/** The total fee on `creatorPay` of cumulative creator pay. */
export function feeTotal(creatorPay: number, bands: FeeBand[]): number {
  let fee = 0;
  let start = 0;
  for (const b of ordered(bands)) {
    const end = b.upTo ?? Infinity;
    const inBand = Math.max(0, Math.min(creatorPay, end) - start);
    fee += (inBand * b.percent) / 100;
    start = end;
    if (creatorPay <= end) break;
  }
  return cents(fee);
}

/** The fee on one more payment of `amount`, when creators have already been paid `before` on this campaign. */
export function feeForPayment(before: number, amount: number, bands: FeeBand[]): number {
  if (bands.length === 0 || amount <= 0) return 0;
  return cents(feeTotal(before + amount, bands) - feeTotal(before, bands));
}

/** What is saved for a campaign: the bands, and a minimum for the month (0 for none). An old array of bands still reads. */
export type FeeTerms = { bands: FeeBand[]; minimum: number };

export function parseFeeTerms(raw: unknown): FeeTerms {
  if (Array.isArray(raw)) return { bands: raw as FeeBand[], minimum: 0 };
  if (raw && typeof raw === "object") {
    const o = raw as { bands?: unknown; minimum?: unknown };
    const minimum = Number(o.minimum);
    return { bands: Array.isArray(o.bands) ? (o.bands as FeeBand[]) : [], minimum: Number.isFinite(minimum) && minimum > 0 ? minimum : 0 };
  }
  return { bands: [], minimum: 0 };
}

/**
 * The fee on a new statement of `amount`, with a minimum per campaign per month. The month's fee is whichever is larger,
 * the minimum or the percentage on all creator pay billed that month, and this statement carries whatever of it has not
 * been charged yet. So $300 then $300 in one month is $200 in all (not $200 twice), and a later $1,000 only adds the
 * extra percentage.
 *  lifetimeBilled: creator pay already billed on the campaign, ever
 *  monthBilled / monthFees: creator pay billed and fee charged so far this month
 */
export function feeForStatement(input: { lifetimeBilled: number; monthBilled: number; monthFees: number; amount: number; terms: FeeTerms }): number {
  const { amount, terms } = input;
  if (amount <= 0 || (terms.bands.length === 0 && terms.minimum <= 0)) return 0;
  const monthStart = input.lifetimeBilled - input.monthBilled;
  const percentFee = feeForPayment(monthStart, input.monthBilled + amount, terms.bands);
  const target = Math.max(terms.minimum, percentFee);
  return cents(Math.max(0, target - input.monthFees));
}

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/** The bands in words, for admin: "25% on top up to $5,000, then 20% up to $20,000, then 15%". */
export function describeFee(bands: FeeBand[], minimum = 0): string {
  const sorted = ordered(bands);
  if (sorted.length === 0) return minimum > 0 ? `${usd(minimum)} a month minimum` : "No fee set";
  const text = sorted
    .map((b, i) => {
      const lead = i === 0 ? `${b.percent}% on top` : `${b.percent}%`;
      return b.upTo === null ? (i === 0 ? lead : `${lead} above that`) : `${lead} up to ${usd(b.upTo)}`;
    })
    .join(", then ");
  return minimum > 0 ? `${text}, minimum ${usd(minimum)} a month` : text;
}

/** From the form's rows: a limit (blank on the last row) and a percentage. Both blank skips the row. */
export function parseFeeRows(getAll: (k: string) => string[]): { ok: true; bands: FeeBand[] } | { ok: false; error: string } {
  const upTo = getAll("fee_upto").map((x) => x.replace(/,/g, "").trim());
  const pct = getAll("fee_pct").map((x) => x.replace(/,/g, "").trim());
  const rows: FeeBand[] = [];
  for (let i = 0; i < Math.max(upTo.length, pct.length); i++) {
    const a = upTo[i] ?? "";
    const p = pct[i] ?? "";
    if (!a && !p) continue;
    const percent = Number(p);
    if (p === "" || !Number.isFinite(percent) || percent < 0 || percent > 100) return { ok: false, error: "Each fee row needs a percentage between 0 and 100." };
    if (a === "") {
      rows.push({ upTo: null, percent });
      continue;
    }
    const limit = Number(a);
    if (!Number.isFinite(limit) || limit <= 0) return { ok: false, error: "A fee band's limit must be an amount above zero, or blank for the last band." };
    rows.push({ upTo: limit, percent });
  }
  if (rows.filter((r) => r.upTo === null).length > 1) return { ok: false, error: "Only the last fee band can have no limit." };
  if (new Set(rows.map((r) => r.upTo)).size !== rows.length) return { ok: false, error: "Two fee bands end at the same amount." };
  return { ok: true, bands: ordered(rows) };
}
