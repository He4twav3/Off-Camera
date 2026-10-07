/**
 * Our fees, worked out from the statements: what each campaign owes us for each
 * creator, added up per campaign and per brand. Pure (no server imports) so the
 * admin screen and the tests share it.
 *
 * A "fee row" is one statement: one creator on one campaign. The fee is the amount
 * we typed when issuing it; "received" is ticked once the brand has paid us.
 */

export type FeeRow = {
  /** The statement's id (what "mark received" acts on). */
  id: string;
  brandId: string | null;
  brand: string | null;
  jobId: string;
  campaign: string;
  creator: string;
  handle: string;
  /** What the brand owes the creator. */
  amount: number;
  /** What the brand owes us for this creator. */
  fee: number;
  issuedAt: string;
  dueAt: string;
  feeReceivedAt: string | null;
};

export type FeeStatus = "received" | "outstanding" | "unset";

export function feeStatus(r: Pick<FeeRow, "fee" | "feeReceivedAt">): FeeStatus {
  if (r.fee <= 0) return "unset";
  return r.feeReceivedAt ? "received" : "outstanding";
}

export type FeeTotals = {
  fee: number;
  received: number;
  outstanding: number;
  /** Creators with no fee set yet: easy to forget, so counted. */
  unset: number;
  creators: number;
};

export type CampaignFees = { jobId: string; campaign: string; rows: FeeRow[]; totals: FeeTotals };
export type BrandFees = { key: string; brand: string; campaigns: CampaignFees[]; totals: FeeTotals };

/** Money in cents, so 0.1 + 0.2 stays exact. */
const cents = (n: number) => Math.round(n * 100);

export function totalsOf(rows: Pick<FeeRow, "fee" | "feeReceivedAt">[]): FeeTotals {
  let fee = 0;
  let received = 0;
  let unset = 0;
  for (const r of rows) {
    const status = feeStatus(r);
    if (status === "unset") {
      unset++;
      continue;
    }
    fee += cents(r.fee);
    if (status === "received") received += cents(r.fee);
  }
  return { fee: fee / 100, received: received / 100, outstanding: (fee - received) / 100, unset, creators: rows.length };
}

/** Brand, then campaign, then creator. Brands owing the most come first. */
export function groupFees(rows: FeeRow[]): BrandFees[] {
  const brands = new Map<string, { brand: string; byJob: Map<string, FeeRow[]> }>();
  for (const r of rows) {
    const key = r.brandId ?? "none";
    const entry = brands.get(key) ?? { brand: r.brand ?? "No brand attached", byJob: new Map() };
    const list = entry.byJob.get(r.jobId) ?? [];
    list.push(r);
    entry.byJob.set(r.jobId, list);
    brands.set(key, entry);
  }

  return [...brands.entries()]
    .map(([key, { brand, byJob }]) => {
      const campaigns: CampaignFees[] = [...byJob.entries()]
        .map(([jobId, list]) => ({
          jobId,
          campaign: list[0].campaign,
          rows: [...list].sort((a, b) => a.creator.localeCompare(b.creator)),
          totals: totalsOf(list),
        }))
        .sort((a, b) => b.totals.outstanding - a.totals.outstanding || a.campaign.localeCompare(b.campaign));
      return { key, brand, campaigns, totals: totalsOf(campaigns.flatMap((c) => c.rows)) };
    })
    .sort((a, b) => b.totals.outstanding - a.totals.outstanding || a.brand.localeCompare(b.brand));
}

export const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: Math.round(n * 100) % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

/**
 * Plain text to paste into an invoice: what this brand owes us, per campaign and per
 * creator. Only fees not yet received.
 */
export function invoiceText(brand: BrandFees): string {
  const lines: string[] = [`Fees owed by ${brand.brand}`, ""];
  for (const c of brand.campaigns) {
    const owed = c.rows.filter((r) => feeStatus(r) === "outstanding");
    if (owed.length === 0) continue;
    lines.push(c.campaign);
    for (const r of owed) lines.push(`  ${r.creator} (@${r.handle}): ${money(r.fee)}`);
    lines.push(`  Campaign total: ${money(c.totals.outstanding)}`, "");
  }
  lines.push(`Total due: ${money(brand.totals.outstanding)}`);
  return lines.join("\n");
}
