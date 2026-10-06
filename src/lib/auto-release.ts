import { calculatePayout, type PayoutTerms } from "@/lib/payout-terms";

/**
 * When may a creator's earnings be released to their balance without an admin
 * touching it? This only plans; the database function release_earning() does
 * the crediting and re-checks the safety rules.
 *
 * Releasing is the bookkeeping step. Sending the money is still a person with a
 * two-step code. A release happens only when ALL of these hold:
 *   - an admin has approved the post (one click),
 *   - the brand has paid us,
 *   - for view-based pay, the measurement window has ended and the view counts
 *     are fresh and non-zero,
 *   - the creator would never be credited more than the brand paid,
 *   - the assignment isn't disputed.
 * Anything else is either "wait" (time will fix it) or "attention" (an admin
 * has to look), and nothing is released.
 */

/** View counts older than this are not trusted for the final amount. */
export const VIEWS_FRESH_DAYS = 3;
const DAY = 24 * 60 * 60 * 1000;

export type ReleaseInput = {
  status: "active" | "submitted" | "paid" | "disputed";
  /** The campaign's payout formula, or null for a plain fixed-fee campaign. */
  terms: PayoutTerms | null;
  /** The creator's agreed amount, used when there is no formula. */
  legacyAmount: number;
  views: number;
  viewsUpdatedAt: Date | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  brandPaid: boolean;
  /** What the brand paid us for this creator. */
  grossFunded: number;
  /** Already credited to the creator for this assignment. */
  released: number;
  stagesDone: string[];
  /** Our commission, taken from the creator's share. null = none. */
  commissionPercent: number | null;
  now: Date;
};

export type ReleasePlan =
  | { kind: "release"; stage: "fixed" | "rest" | "full"; amount: number; final: boolean; note: string }
  | { kind: "wait"; reason: string; until?: Date }
  | { kind: "attention"; reason: string };

const cents = (n: number) => Math.round(n * 100) / 100;
const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export function hasPerformancePay(terms: PayoutTerms): boolean {
  return terms.cpm !== null || terms.bonuses.length > 0;
}

export function planRelease(i: ReleaseInput): ReleasePlan {
  if (i.status === "paid") return { kind: "wait", reason: "Already released." };
  if (i.status === "active") return { kind: "wait", reason: "The creator hasn't submitted a post yet." };
  if (i.status === "disputed") return { kind: "attention", reason: "This assignment is disputed. Resolve it first." };
  if (!i.approvedAt) return { kind: "attention", reason: "Approve the post to start the automatic release." };
  if (!i.brandPaid) return { kind: "attention", reason: "Waiting for the brand's payment. Tick 'brand paid' once it arrives." };
  if (i.stagesDone.includes("full") || i.stagesDone.includes("rest")) return { kind: "wait", reason: "Already released." };

  const keep = 1 - (i.commissionPercent ?? 0) / 100;
  const net = (n: number) => cents(n * keep);
  const within = (amount: number): ReleasePlan | null =>
    cents(i.released + amount) > cents(i.grossFunded)
      ? {
          kind: "attention",
          reason: `The brand paid ${usd(i.grossFunded)}, but this release would bring the creator to ${usd(cents(i.released + amount))}. Get the difference paid or release by hand.`,
        }
      : null;

  // No formula: a plain agreed amount, released once approved and funded.
  if (!i.terms) {
    const amount = cents(i.legacyAmount);
    if (amount <= 0) return { kind: "attention", reason: "The creator's amount is zero. Set it first." };
    return within(amount) ?? { kind: "release", stage: "full", amount, final: true, note: "Approved post" };
  }

  const terms = i.terms;
  const fixedGross = terms.fixedPerVideo * terms.videos;
  const fixedCapped = terms.capPerCreator !== null ? Math.min(fixedGross, terms.capPerCreator) : fixedGross;

  // Fixed fee only: nothing to measure, so release at approval.
  if (!hasPerformancePay(terms)) {
    const amount = net(calculatePayout(terms, 0).total);
    if (amount <= 0) return { kind: "attention", reason: "The campaign formula pays nothing. Check it." };
    return within(amount) ?? { kind: "release", stage: "full", amount, final: true, note: "Fixed fee" };
  }

  // Fixed fee "paid on approval", with performance pay still to measure: pay the fixed part now.
  if (terms.fixedPaidOn === "approval" && fixedCapped > 0 && !i.stagesDone.includes("fixed")) {
    const amount = net(fixedCapped);
    return within(amount) ?? { kind: "release", stage: "fixed", amount, final: false, note: "Fixed fee" };
  }

  // Everything else waits for the measurement window to end.
  if (!i.submittedAt) return { kind: "attention", reason: "No submission time is recorded for this post." };
  const eligibleAt = new Date(i.submittedAt.getTime() + terms.measureDays * DAY);
  if (i.now.getTime() < eligibleAt.getTime()) {
    return { kind: "wait", reason: `Measuring views for ${terms.measureDays} days.`, until: eligibleAt };
  }
  if (!i.viewsUpdatedAt || i.now.getTime() - i.viewsUpdatedAt.getTime() > VIEWS_FRESH_DAYS * DAY) {
    return { kind: "attention", reason: "The view counts are out of date. Check the post link and the view counting." };
  }
  if (i.views <= 0) return { kind: "attention", reason: "No views were counted. Check the post link." };

  const total = net(calculatePayout(terms, i.views).total);
  const amount = cents(total - i.released);
  if (amount <= 0) return { kind: "attention", reason: "Nothing is left to release. Check the amounts." };
  return (
    within(amount) ?? {
      kind: "release",
      stage: i.stagesDone.includes("fixed") ? "rest" : "full",
      amount,
      final: true,
      note: `${i.views.toLocaleString("en-US")} views`,
    }
  );
}
