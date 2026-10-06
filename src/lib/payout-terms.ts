import { z } from "zod";

/**
 * A campaign's payout formula, set per campaign because every brand asks for
 * something different: a fixed fee, a fixed fee plus a bonus, only a rate per
 * 1,000 views, and so on. The parts are optional and can be combined:
 *
 *   fixed        a fee per video (× the number of videos required)
 *   cpm          a rate per 1,000 views, optionally only above a starting point
 *   bonuses      one-off amounts paid when the views reach a target
 *   capPerCreator the most one creator can earn on the campaign
 *   measureDays  how many days after posting views are counted
 *
 * `calculatePayout` turns the formula plus the views into money, and
 * `describeTerms` turns it into the plain-language terms creators and brands
 * see (and that go into the campaign contract). Stored as JSON on the job.
 */

export const payoutTermsSchema = z.object({
  v: z.literal(1),
  videos: z.number().int().min(1).max(50),
  fixedPerVideo: z.number().min(0).max(1_000_000),
  cpm: z
    .object({
      ratePer1000: z.number().positive().max(100_000),
      startsAt: z.number().int().min(0).max(1_000_000_000),
    })
    .nullable(),
  bonuses: z
    .array(z.object({ views: z.number().int().positive(), amount: z.number().positive().max(1_000_000) }))
    .max(6),
  capPerCreator: z.number().positive().max(10_000_000).nullable(),
  measureDays: z.number().int().min(1).max(365),
  fixedPaidOn: z.enum(["approval", "end"]),
});

export type PayoutTerms = z.infer<typeof payoutTermsSchema>;

export type PayoutBreakdown = {
  fixed: number;
  performance: number;
  bonuses: { views: number; amount: number }[];
  bonusTotal: number;
  /** Before any cap. */
  uncapped: number;
  /** What the brand pays for this creator (after any cap). */
  total: number;
  capped: boolean;
};

const cents = (n: number) => Math.round(n * 100) / 100;

/** Safely reads stored JSON back into terms (null if missing or malformed). */
export function parsePayoutTerms(raw: unknown): PayoutTerms | null {
  const r = payoutTermsSchema.safeParse(raw);
  return r.success ? r.data : null;
}

/** Money earned for `views` total views on the campaign's post(s). */
export function calculatePayout(terms: PayoutTerms, views: number): PayoutBreakdown {
  const v = Math.max(0, Math.floor(views));
  const fixed = cents(terms.fixedPerVideo * terms.videos);
  const performance = terms.cpm
    ? cents((Math.max(0, v - terms.cpm.startsAt) / 1000) * terms.cpm.ratePer1000)
    : 0;
  // Every bonus whose target has been reached is paid (they stack).
  const bonuses = terms.bonuses.filter((b) => v >= b.views).map((b) => ({ ...b }));
  const bonusTotal = cents(bonuses.reduce((n, b) => n + b.amount, 0));
  const uncapped = cents(fixed + performance + bonusTotal);
  const total = terms.capPerCreator !== null ? Math.min(uncapped, terms.capPerCreator) : uncapped;
  return { fixed, performance, bonuses, bonusTotal, uncapped, total: cents(total), capped: total < uncapped };
}

const money = (n: number, cur: string) =>
  `${cur}${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const num = (n: number) => n.toLocaleString("en-US");

/** The formula in plain language, one clause per line. */
export function describeTerms(terms: PayoutTerms, cur = "$"): string[] {
  const lines: string[] = [];
  const total = terms.fixedPerVideo * terms.videos;
  if (terms.fixedPerVideo > 0) {
    lines.push(
      terms.videos === 1
        ? `Fixed fee: ${money(terms.fixedPerVideo, cur)} for the video, paid ${
            terms.fixedPaidOn === "approval" ? "once the post is approved" : "when the measurement period ends"
          }.`
        : `Fixed fee: ${money(terms.fixedPerVideo, cur)} per video for ${terms.videos} videos (${money(total, cur)} in total), paid ${
            terms.fixedPaidOn === "approval" ? "as each post is approved" : "when the measurement period ends"
          }.`,
    );
  }
  if (terms.cpm) {
    lines.push(
      terms.cpm.startsAt > 0
        ? `Performance fee: ${money(terms.cpm.ratePer1000, cur)} for every 1,000 views above ${num(terms.cpm.startsAt)}.`
        : `Performance fee: ${money(terms.cpm.ratePer1000, cur)} for every 1,000 views.`,
    );
  }
  for (const b of [...terms.bonuses].sort((a, c) => a.views - c.views)) {
    lines.push(`Bonus: ${money(b.amount, cur)} when views reach ${num(b.views)}.`);
  }
  if (terms.capPerCreator !== null) {
    lines.push(`Maximum payout: ${money(terms.capPerCreator, cur)} per creator for this campaign.`);
  }
  lines.push(
    `Views are counted for ${terms.measureDays} days after the post goes live, using OnCamera's view tracking. Performance-based amounts are calculated and paid when that period ends.`,
  );
  return lines;
}
