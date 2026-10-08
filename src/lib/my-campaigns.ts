import {
  moneyBar,
  parsePostTerms,
  payFor,
  type MoneyBar,
  type PostForPay,
} from "@/lib/post-terms";

/**
 * One line of "My campaigns": a campaign the creator has joined, with its tracking in
 * short. A campaign paid per post shows total earned, the money bar and the payment
 * cycle; any other campaign shows its status and expected pay. Pure, so it can be tested.
 */

export type MyCampaignRow = {
  jobId: string;
  assignmentId: string;
  title: string;
  logoUrl: string | null;
  platform: string;
  /** Total earned so far, in US dollars. */
  amount: number;
  /** "post" is paid per post and tracked; "basic" is any other campaign. */
  kind: "post" | "basic";
  bar: MoneyBar | null;
  posts: number;
  cycleSize: number | null;
  inCycle: number;
  views: number;
  statusLabel: string | null;
};

type Input = {
  assignmentId: string;
  status: string;
  expectedAmount: number;
  job: {
    id: string;
    title: string;
    logo_url: string | null;
    platform: string;
    post_terms: unknown;
  };
  posts: (PostForPay & { views: number })[];
  paidTotal: number;
};

const STATUS: Record<string, string> = {
  active: "In progress",
  submitted: "In review",
  paid: "Paid",
  disputed: "Being looked at",
};

export function myCampaignRow(i: Input, now: Date = new Date()): MyCampaignRow {
  const terms = parsePostTerms(i.job.post_terms);
  const base = {
    jobId: i.job.id,
    assignmentId: i.assignmentId,
    title: i.job.title,
    logoUrl: i.job.logo_url,
    platform: i.job.platform,
  };

  if (!terms) {
    return {
      ...base,
      amount: i.expectedAmount,
      kind: "basic",
      bar: null,
      posts: 0,
      cycleSize: null,
      inCycle: 0,
      views: 0,
      statusLabel: STATUS[i.status] ?? i.status,
    };
  }

  const pay = payFor(terms, i.posts, now);
  const counted = new Set(pay.posts.map((p) => p.id));
  return {
    ...base,
    amount: pay.earned,
    kind: "post",
    bar: moneyBar(pay, i.paidTotal),
    posts: pay.counted,
    cycleSize: terms.cycleSize,
    inCycle: pay.counted % terms.cycleSize,
    views: i.posts
      .filter((p) => counted.has(p.id))
      .reduce((n, p) => n + p.views, 0),
    statusLabel: null,
  };
}

/** Most money first for tracked campaigns that still have something due, then the rest by name. */
export function sortMyCampaigns(rows: MyCampaignRow[]): MyCampaignRow[] {
  return [...rows].sort(
    (a, b) =>
      (b.bar?.due ?? 0) - (a.bar?.due ?? 0) ||
      b.amount - a.amount ||
      a.title.localeCompare(b.title),
  );
}
