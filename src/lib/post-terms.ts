import { z } from "zod";

/**
 * Pay for a campaign whose contract pays per video (the Getimg contract is the first).
 * It is separate from the older whole-campaign formula in payout-terms.ts, which stays
 * exactly as it was for every other campaign.
 *
 * The rules, as the contract states them:
 *   - a base fee for each approved post, paid after every `cycleSize` posts are delivered
 *   - a bonus for each post at the highest view milestone it reached. Milestones do NOT
 *     stack: 1,000 views earns the 1,000 bonus, and reaching 5,000 later adds only the
 *     difference, so the total is the 5,000 bonus, not both
 *   - only views within `windowDays` of the post's upload count
 *   - every post is measured on its own
 *
 * Pure (no server imports), so the creator's page, the brand's page, the admin and the
 * tests all work out the same dollars the same way.
 */

export const postTermsSchema = z.object({
  v: z.literal(2),
  basePerPost: z.number().min(0).max(100_000),
  /** A payment cycle completes when this many posts have been delivered. */
  cycleSize: z.number().int().min(1).max(200),
  /** Bonus tiers, lowest first. Each is the total bonus for that tier, not an add-on. */
  milestones: z
    .array(
      z.object({
        views: z.number().int().positive(),
        amount: z.number().positive().max(1_000_000),
      }),
    )
    .max(10),
  /** Views count for this many days after the post goes live, then freeze. */
  windowDays: z.number().int().min(1).max(365),
  /** The creator keeps each approved post public for this long. */
  keepPublicDays: z.number().int().min(0).max(1000),
  platforms: z
    .array(z.enum(["tiktok", "instagram", "youtube_shorts", "x"]))
    .min(1),
});

export type PostTerms = z.infer<typeof postTermsSchema>;

export function parsePostTerms(raw: unknown): PostTerms | null {
  const parsed = postTermsSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    milestones: [...parsed.data.milestones].sort((a, b) => a.views - b.views),
  };
}

/** The Getimg contract (SideShift agreement, section 3). */
export const GETIMG_TERMS: PostTerms = {
  v: 2,
  basePerPost: 20,
  cycleSize: 15,
  milestones: [
    { views: 1_000, amount: 2 },
    { views: 5_000, amount: 10 },
    { views: 10_000, amount: 20 },
    { views: 100_000, amount: 200 },
  ],
  windowDays: 30,
  keepPublicDays: 90,
  platforms: ["instagram", "tiktok", "youtube_shorts"],
};

/** The bonus a post has earned: the highest milestone it reached (0 if none). */
export function milestoneBonus(
  views: number,
  milestones: PostTerms["milestones"],
): number {
  let best = 0;
  for (const m of milestones)
    if (views >= m.views && m.amount > best) best = m.amount;
  return best;
}

/** The last moment views count for a post published at `postedAt`. */
export function windowEnd(postedAt: Date, windowDays: number): Date {
  return new Date(postedAt.getTime() + windowDays * 24 * 60 * 60 * 1000);
}

export type PostForPay = {
  id: string;
  state: "counting" | "final" | "rejected";
  /** Found on one of the creator's own verified accounts. */
  authorVerified: boolean;
  views: number;
  submittedAt: string;
  windowEndsAt: string | null;
  /** The original post this one repeats (the same video on another platform). Null for a unique video. */
  repostOf?: string | null;
};

export type PostPay = {
  id: string;
  /** Which payment cycle this post belongs to (1, 2, 3...). */
  cycle: number;
  base: number;
  bonus: number;
  windowClosed: boolean;
  /** The same video as another post, on another platform: no base pay. */
  repost?: boolean;
  /** Whole days of counting left (0 once closed), or null if the window isn't known yet. */
  daysLeft: number | null;
};

export type PayTotals = {
  posts: PostPay[];
  /** Posts that count: not rejected and found on the creator's own account (reposts included). */
  counted: number;
  /** Unique videos among them: what the payment cycles are counted in. */
  unique: number;
  cyclesCompleted: number;
  /** Everything earned so far, including bonuses that can still change. */
  earned: number;
  /** What the contract says is due now: base for completed cycles, plus bonuses whose window has closed. */
  payable: number;
  /** Earned but not due yet: a cycle still filling, or a window still open. */
  accruing: number;
};

const cents = (n: number) => Math.round(n * 100);
const DAY = 24 * 60 * 60 * 1000;

export function payFor(
  terms: PostTerms,
  allPosts: PostForPay[],
  now: Date = new Date(),
): PayTotals {
  const counted = allPosts
    .filter((p) => p.state !== "rejected" && p.authorVerified)
    .sort(
      (a, b) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime() ||
        a.id.localeCompare(b.id),
    );

  // The base fee is per UNIQUE video. A repost (the same video on another platform) keeps its
  // view bonus but earns no base and doesn't count toward the payment cycle.
  const countedIds = new Set(counted.map((p) => p.id));
  const isRepost = (p: PostForPay) => Boolean(p.repostOf && countedIds.has(p.repostOf));
  const uniques = counted.filter((p) => !isRepost(p));
  const cycleOf = new Map(
    uniques.map((p, i) => [p.id, Math.floor(i / terms.cycleSize) + 1]),
  );

  const posts: PostPay[] = counted.map((p) => {
    const windowEnds = p.windowEndsAt ? new Date(p.windowEndsAt) : null;
    const windowClosed =
      p.state === "final" || (windowEnds !== null && now >= windowEnds);
    const repost = isRepost(p);
    return {
      id: p.id,
      cycle: repost ? (cycleOf.get(p.repostOf!) ?? 1) : (cycleOf.get(p.id) ?? 1),
      base: repost ? 0 : terms.basePerPost,
      bonus: milestoneBonus(p.views, terms.milestones),
      windowClosed,
      daysLeft: windowClosed
        ? 0
        : windowEnds
          ? Math.max(0, Math.ceil((windowEnds.getTime() - now.getTime()) / DAY))
          : null,
      repost,
    };
  });

  const cyclesCompleted = Math.floor(uniques.length / terms.cycleSize);
  let earned = 0;
  let payable = 0;
  for (const p of posts) {
    earned += cents(p.base) + cents(p.bonus);
    if (p.cycle <= cyclesCompleted) payable += cents(p.base);
    if (p.windowClosed) payable += cents(p.bonus);
  }
  return {
    posts,
    counted: counted.length,
    unique: uniques.length,
    cyclesCompleted,
    earned: earned / 100,
    payable: payable / 100,
    accruing: (earned - payable) / 100,
  };
}

/** What to put on the next statement: what is due now, less what earlier statements already cover. */
export function suggestedStatement(
  due: Pick<PayTotals, "payable">,
  alreadyStatemented: number,
): number {
  return Math.max(0, (cents(due.payable) - cents(alreadyStatemented)) / 100);
}

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: Math.round(n * 100) % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const views = (n: number) => (n >= 1000 ? `${n / 1000}K` : String(n));

/** The pay as short labels for a strip: base, milestones, cycle, window. */
export function postTermsChips(terms: PostTerms): string[] {
  const chips: string[] = [];
  if (terms.basePerPost > 0) chips.push(`${usd(terms.basePerPost)} per post`);
  const top = terms.milestones.at(-1);
  if (top) chips.push(`Bonus up to ${usd(top.amount)} per post`);
  chips.push(`Paid every ${terms.cycleSize} posts`);
  chips.push(`${terms.windowDays}-day counting window`);
  return chips;
}

/** The pay in plain sentences, for the campaign page and the contract. */
export function describePostTerms(terms: PostTerms): string[] {
  const lines: string[] = [];
  if (terms.basePerPost > 0) {
    lines.push(`Base pay: ${usd(terms.basePerPost)} for each unique video. It is paid after every ${terms.cycleSize} unique videos you deliver.`);
    lines.push("The same video on another platform is a repost: it doesn't earn the base pay again. Mark it as a repost when you add it.");
  }
  if (terms.milestones.length > 0) {
    lines.push(
      `Bonus per post, at the highest milestone it reaches: ${terms.milestones.map((m) => `${views(m.views)} views, ${usd(m.amount)}`).join(" · ")}.`,
    );
    lines.push("Bonuses don't stack. A post that reaches 5K after 1K earns the 5K bonus in total: you are paid the difference.");
  }
  lines.push(`Every post is measured on its own. Only views within ${terms.windowDays} days of the post going live count, then the number is final.`);
  lines.push("Your post has to be on one of your own verified accounts, and go live after you connected that account and joined.");
  if (terms.keepPublicDays > 0) lines.push(`Keep each post public for ${terms.keepPublicDays} days.`);
  lines.push("Views are updated about once a day.");
  return lines;
}

// --- the tracking view: the money bar and the history by payment cycle ----------------------------

/** One post as the tracking screens show it. */
export type PostRowData = PostForPay & {
  platform: "tiktok" | "instagram" | "youtube_shorts" | "x";
  url: string;
  rejectReason: string | null;
  lastError: string | null;
  /** When its views were last read from the platform (ISO). */
  viewsCountedAt?: string | null;
};

export type MoneyBar = {
  /** Confirmed by the creator as received. */
  paid: number;
  /** Due under the contract (finished cycles, final bonuses) but not paid yet. */
  due: number;
  /** Earned in a cycle that is still filling, or on a post still counting. Can still change. */
  counting: number;
  total: number;
};

/**
 * Where the money stands, in three parts that add up to everything earned so far:
 * paid, due and still counting. `paidTotal` is what the creator has confirmed receiving.
 */
export function moneyBar(pay: Pick<PayTotals, "earned" | "payable" | "accruing">, paidTotal: number): MoneyBar {
  const paid = Math.min(cents(paidTotal), cents(pay.earned));
  const due = Math.max(0, cents(pay.payable) - paid);
  const counting = cents(pay.earned) - paid - due;
  return { paid: paid / 100, due: due / 100, counting: counting / 100, total: pay.earned };
}

export type CycleRow = {
  cycle: number;
  posts: number;
  views: number;
  earned: number;
  /** "current": still filling. "paid" / "unpaid": a finished cycle, by whether payments received cover it. */
  status: "current" | "paid" | "unpaid";
  from: string | null;
  to: string | null;
};

/**
 * The history, one row per payment cycle, newest first. A finished cycle counts as paid
 * once payments received (oldest cycles first) cover what it earned.
 */
export function cycleHistory(terms: PostTerms, allPosts: PostRowData[], paidTotal: number, now: Date = new Date()): CycleRow[] {
  const pay = payFor(terms, allPosts, now);
  const byId = new Map(allPosts.map((p) => [p.id, p]));
  const groups = new Map<number, { posts: number; views: number; earned: number; times: number[] }>();
  for (const p of pay.posts) {
    const g = groups.get(p.cycle) ?? { posts: 0, views: 0, earned: 0, times: [] };
    const src = byId.get(p.id)!;
    g.posts += 1;
    g.views += src.views;
    g.earned += cents(p.base) + cents(p.bonus);
    g.times.push(new Date(src.submittedAt).getTime());
    groups.set(p.cycle, g);
  }

  let remaining = cents(paidTotal);
  const rows: CycleRow[] = [];
  for (const cycle of [...groups.keys()].sort((a, b) => a - b)) {
    const g = groups.get(cycle)!;
    const finished = g.posts >= terms.cycleSize;
    let status: CycleRow["status"] = "current";
    if (finished) {
      status = remaining >= g.earned ? "paid" : "unpaid";
      remaining = Math.max(0, remaining - g.earned);
    }
    rows.push({
      cycle,
      posts: g.posts,
      views: g.views,
      earned: g.earned / 100,
      status,
      from: new Date(Math.min(...g.times)).toISOString(),
      to: new Date(Math.max(...g.times)).toISOString(),
    });
  }
  return rows.reverse();
}

/** The average earned per counted post, or 0 with none. */
export function averagePerPost(pay: Pick<PayTotals, "earned" | "counted">): number {
  return pay.counted === 0 ? 0 : Math.round((pay.earned / pay.counted) * 100) / 100;
}
