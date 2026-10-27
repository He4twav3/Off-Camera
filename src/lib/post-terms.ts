import { z } from "zod";
import { STATEMENT_DUE_DAYS } from "@/lib/direct-pay";

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

/** The brand's contract details, filled in on its own campaign page and kept with the campaign's pay terms. */
export const contractSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  address: z.string().trim().min(5).max(400),
  country: z.string().trim().min(2).max(80),
  signatory: z.string().trim().min(2).max(120),
  signatoryRole: z.string().trim().max(120).default(""),
  /** When the brand agreed, and who (their sign-in email). */
  agreedAt: z.string(),
  agreedByEmail: z.string().max(200),
  /** The pay terms as they were when the brand agreed, to tell if they have changed since. */
  terms: z.string().max(2000),
  /** The exact contract text the brand was shown when it agreed, and where it agreed from, as the evidence of it. */
  text: z.string().max(30000).optional(),
  ip: z.string().max(64).optional(),
});
export type ContractDetails = z.infer<typeof contractSchema>;

/** What every creator must know before joining: how much to post, how long, and anything else. The brand sets it first. */
export const requirementsSchema = z.object({
  count: z.number().int().min(1).max(1000).optional(),
  period: z.enum(["day", "week", "month"]).default("week"),
  length: z.string().trim().max(60).default(""),
  note: z.string().trim().max(300).default(""),
});
export type Requirements = z.infer<typeof requirementsSchema>;

/**
 * View pay as a CPM (dollars per 1,000 views), in bands: "$1 CPM until 1,000 views, then $2 CPM over 1,000 views" is
 * [{ from: 0, rate: 1 }, { from: 1000, rate: 2 }]. Each band pays only for the views inside it. When a campaign has
 * these, they replace the fixed milestone bonuses.
 */
export const cpmTierSchema = z.object({
  from: z.number().int().min(0).max(1_000_000_000),
  rate: z.number().positive().max(1000),
});
export type CpmTier = z.infer<typeof cpmTierSchema>;

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
  /** CPM bands for view pay, lowest first. When present they replace `milestones`. */
  cpm: z.array(cpmTierSchema).max(6).optional(),
  /** The most views that earn CPM pay on one post. Views past it earn nothing more. Unset means no cap. */
  cpmCap: z.number().int().min(1).max(1_000_000_000).optional(),
  /** A post earns no view pay until it reaches this many views; from then on its views count from the first. */
  minViews: z.number().int().min(1).max(1_000_000_000).optional(),
  /** The most view pay one post can earn, in dollars. Anything past it earns nothing more. Unset means no maximum. */
  maxPerPost: z.number().positive().max(10_000_000).optional(),
  /** Views count for this many days after the post goes live, then freeze. */
  windowDays: z.number().int().min(1).max(365),
  /** The creator keeps each approved post public for this long. */
  keepPublicDays: z.number().int().min(0).max(1000),
  platforms: z
    .array(z.enum(["tiktok", "instagram", "youtube_shorts", "x"]))
    .min(1),
  /**
   * false (the default): the base fee is for ONE unique video. The creator's first post sets
   * their main platform; posts there earn the base. The same video on other platforms is a
   * repost and earns view bonuses only. true: every post earns the base.
   */
  repostsEarnBase: z.boolean().default(false),
  /**
   * Who checks each post before it is paid: "oncamera" (our team, the default, so brands don't
   * have to) or "brand". A post is only counted into what is due once it has been approved.
   */
  reviewer: z.enum(["oncamera", "brand"]).default("oncamera"),
  /** How often creators get a statement: after every `cycleSize` videos (the default) or once a month. */
  statementEvery: z.enum(["videos", "month"]).optional(),
  /** Days the brand has to pay a statement. Unset means the standard STATEMENT_DUE_DAYS. */
  dueDays: z.number().int().min(1).max(90).optional(),
  /** Set once the brand has filled in and agreed to the contract (see lib/contract.ts). */
  contract: contractSchema.optional(),
  requirements: requirementsSchema.optional(),
});

export type PostTerms = z.infer<typeof postTermsSchema>;

export function parsePostTerms(raw: unknown): PostTerms | null {
  const parsed = postTermsSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    milestones: [...parsed.data.milestones].sort((a, b) => a.views - b.views),
    ...(parsed.data.cpm?.length
      ? { cpm: [...parsed.data.cpm].sort((a, b) => a.from - b.from), cpmCap: parsed.data.cpmCap, minViews: parsed.data.minViews, maxPerPost: parsed.data.maxPerPost }
      : { cpm: undefined, cpmCap: undefined, minViews: undefined, maxPerPost: undefined }),
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
  repostsEarnBase: false,
  reviewer: "oncamera",
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

/** What a post's views earn under CPM bands: each band pays its rate per 1,000 views for the views inside it. */
export function cpmBonus(views: number, tiers: CpmTier[], cap?: number, minViews?: number, maxPerPost?: number): number {
  if (minViews && views < minViews) return 0;
  const sorted = [...tiers].sort((a, b) => a.from - b.from);
  const counted = cap ? Math.min(views, cap) : views;
  let cents = 0;
  sorted.forEach((t, i) => {
    const end = sorted[i + 1]?.from ?? Infinity;
    const inBand = Math.max(0, Math.min(counted, end) - t.from);
    cents += (inBand / 1000) * t.rate * 100;
  });
  const pay = Math.round(cents) / 100;
  return maxPerPost ? Math.min(pay, maxPerPost) : pay;
}

/** The view pay a post has earned: by CPM bands when the campaign has them, otherwise by milestone. */
export function bonusFor(views: number, terms: Pick<PostTerms, "milestones" | "cpm" | "cpmCap"> & Partial<Pick<PostTerms, "minViews" | "maxPerPost">>): number {
  if (!terms.cpm?.length) return milestoneBonus(views, terms.milestones);
  // With a CPM, a milestone is a reward on top: the highest one a video reaches is paid in addition to the CPM.
  const earned = cpmBonus(views, terms.cpm, terms.cpmCap, terms.minViews) + milestoneBonus(views, terms.milestones);
  const total = Math.round(earned * 100) / 100;
  return terms.maxPerPost ? Math.min(total, terms.maxPerPost) : total;
}

/**
 * The most one video can earn, as a dollar figure however the brand entered the limit (as dollars, or as a number of
 * views that stop counting). Null when nothing limits it. Base pay is included, so the creator reads one number.
 */
export function maxPerVideo(terms: Pick<PostTerms, "basePerPost" | "cpm" | "cpmCap" | "maxPerPost"> & Partial<Pick<PostTerms, "milestones">>): number | null {
  if (!terms.cpm?.length) return null;
  const reward = terms.milestones?.reduce((m, x) => Math.max(m, x.amount), 0) ?? 0;
  const fromViews = terms.cpmCap ? cpmBonus(terms.cpmCap, terms.cpm) + reward : null;
  const limits = [fromViews, terms.maxPerPost ?? null].filter((n): n is number => n !== null);
  if (limits.length === 0) return null;
  return Math.round((Math.min(...limits) + terms.basePerPost) * 100) / 100;
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
  /** Where it was posted. Decides whether it earns the base (see PostTerms.repostsEarnBase). */
  platform?: string;
  /** Approved by the reviewer. Undefined means review isn't being tracked (treated as approved). */
  reviewed?: boolean;
};

export type PostPay = {
  id: string;
  /** Which payment cycle this post belongs to (1, 2, 3...). */
  cycle: number;
  base: number;
  bonus: number;
  windowClosed: boolean;
  /** Posted on a platform other than the main one: the same video again, no base pay. */
  repost?: boolean;
  /** Still waiting for its review: earned, but not yet counted into what is due. */
  inReview?: boolean;
  /** Whole days of counting left (0 once closed), or null if the window isn't known yet. */
  daysLeft: number | null;
};

export type PayTotals = {
  posts: PostPay[];
  /** Posts that count: not rejected and found on the creator's own account. */
  counted: number;
  /** Unique videos among them (main platform): what the payment cycles are counted in. */
  unique: number;
  /** Posts still waiting for their review. */
  awaitingReview: number;
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

/**
 * The creator's main platform: where their first counted post is. Null when no post counts
 * yet, or when every post earns the base (repostsEarnBase). Pass the posts oldest first.
 */
export function mainPlatformOf(
  terms: Pick<PostTerms, "repostsEarnBase">,
  posts: Pick<PostForPay, "state" | "authorVerified" | "submittedAt" | "platform">[],
): string | null {
  if (terms.repostsEarnBase) return null;
  const first = posts
    .filter((p) => p.state !== "rejected" && p.authorVerified && p.platform)
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())[0];
  return first?.platform ?? null;
}

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

  // The base fee is for one unique video. The first counted post sets the main platform; posts
  // there earn the base, the same video on another platform is a repost (view bonus only) and
  // doesn't count toward the payment cycle.
  const main = mainPlatformOf(terms, counted);
  const isRepost = (p: PostForPay) =>
    main !== null && p.platform !== undefined && p.platform !== main;
  const uniques = counted.filter((p) => !isRepost(p));
  let cycle = 1;
  let uniqueSeen = 0;

  const posts: PostPay[] = counted.map((p) => {
    const windowEnds = p.windowEndsAt ? new Date(p.windowEndsAt) : null;
    const windowClosed =
      p.state === "final" || (windowEnds !== null && now >= windowEnds);
    const repost = isRepost(p);
    if (!repost) {
      cycle = Math.floor(uniqueSeen / terms.cycleSize) + 1;
      uniqueSeen++;
    }
    return {
      id: p.id,
      cycle,
      base: repost ? 0 : terms.basePerPost,
      bonus: bonusFor(p.views, terms),
      windowClosed,
      daysLeft: windowClosed
        ? 0
        : windowEnds
          ? Math.max(0, Math.ceil((windowEnds.getTime() - now.getTime()) / DAY))
          : null,
      repost,
      inReview: p.reviewed === false,
    };
  });

  const cyclesCompleted = Math.floor(uniques.length / terms.cycleSize);
  let earned = 0;
  let payable = 0;
  for (const p of posts) {
    earned += cents(p.base) + cents(p.bonus);
    // Only reviewed posts count into what is due. A post still in review is earned, not payable.
    if (p.inReview) continue;
    if (p.cycle <= cyclesCompleted) payable += cents(p.base);
    if (p.windowClosed) payable += cents(p.bonus);
  }
  return {
    posts,
    counted: counted.length,
    unique: uniques.length,
    awaitingReview: posts.filter((p) => p.inReview).length,
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
const views = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${n / 1000}K` : String(n));

/** CPM bands in words: "$1 CPM until 1K views", "$2 CPM over 1K views". */
export function cpmPhrases(tiers: CpmTier[], cap?: number): string[] {
  const sorted = [...tiers].sort((a, b) => a.from - b.from);
  return sorted.map((t, i) => {
    const next = sorted[i + 1];
    const last = !next;
    // With a cap the last band ends at it: "$2 CPM from 1K to 5K views".
    if (last && cap) return t.from > 0 ? `${usd(t.rate)} CPM from ${views(t.from)} to ${views(cap)} views` : `${usd(t.rate)} CPM up to ${views(cap)} views`;
    if (i === 0) return t.from > 0 ? `${usd(t.rate)} CPM over ${views(t.from)} views` : `${usd(t.rate)} CPM${next ? ` until ${views(next.from)} views` : ""}`;
    return `${usd(t.rate)} CPM over ${views(t.from)} views`;
  });
}

/** The rate as one short label: "$2 per 1K views", or "$1.25–$3.50 per 1K views" when it changes with the views. */
export function ratePhrase(tiers: CpmTier[]): string {
  const rates = tiers.map((t) => t.rate);
  const lo = Math.min(...rates);
  const hi = Math.max(...rates);
  return lo === hi ? `${usd(lo)} per 1K views` : `${usd(lo)}–${usd(hi)} per 1K views`;
}

/** The pay as short labels for a strip: base, CPM or milestones, cycle, window. */
export function postTermsChips(terms: PostTerms): string[] {
  const chips: string[] = [];
  if (terms.basePerPost > 0) chips.push(`${usd(terms.basePerPost)} per post`);
  if (terms.cpm?.length) {
    // The strip is the short version: rate, minimum, maximum. The reward and the rest are in the brief and the contract.
    chips.push(ratePhrase(terms.cpm));
    if (terms.minViews) chips.push(`${views(terms.minViews)} min views`);
    const max = maxPerVideo(terms);
    if (max !== null) chips.push(`${usd(max)} max per video`);
    return chips;
  }
  else {
    const top = terms.milestones.at(-1);
    if (top) chips.push(`Up to ${usd(top.amount)} bonus per video`);
  }
  // With no base pay there is nothing to pay per batch of posts: view pay is due once each video's window closes.
  if (terms.basePerPost > 0) chips.push(`Paid every ${terms.cycleSize} posts`);
  chips.push(`${terms.windowDays}-day counting window`);
  return chips;
}

/** The pay in plain sentences, for the campaign page and the contract. */
export function describePostTerms(terms: PostTerms): string[] {
  const lines: string[] = [];
  if (terms.basePerPost > 0) {
    if (terms.repostsEarnBase) {
      lines.push(`Base pay: ${usd(terms.basePerPost)} for each approved post.${terms.statementEvery === "month" ? "" : ` It is paid ${terms.cycleSize === 1 ? "after each post" : `after every ${terms.cycleSize} posts`} you deliver.`}`);
    } else {
      lines.push(`Base pay: ${usd(terms.basePerPost)} for each unique video.${terms.statementEvery === "month" ? "" : ` It is paid ${terms.cycleSize === 1 ? "after each unique video" : `after every ${terms.cycleSize} unique videos`} you deliver.`}`);
      lines.push("Your first post sets your main platform. Posts on your main platform earn the base pay. The same video on your other platforms is a repost: it earns view bonuses only.");
    }
  }
  if (terms.cpm?.length) {
    lines.push(`Views pay a CPM, which is dollars per 1,000 views: ${cpmPhrases(terms.cpm).join(", then ")}. Each band pays only for the views inside it.`);
    if (terms.minViews) lines.push(`A video starts earning view pay once it reaches ${views(terms.minViews)} views. Below that it earns nothing from views.`);
    if (terms.cpmCap) lines.push(`The CPM counts up to ${views(terms.cpmCap)} views on each video, which is ${usd(cpmBonus(terms.cpmCap, terms.cpm))}.`);
    const rewards = [...terms.milestones].sort((a, b) => a.views - b.views);
    if (rewards.length === 1) lines.push(`Reward: ${usd(rewards[0].amount)} on top, once a video reaches ${views(rewards[0].views)} views.`);
    else if (rewards.length > 1)
      lines.push(`Rewards on top of the CPM: ${rewards.map((m) => `${usd(m.amount)} at ${views(m.views)} views`).join(", ")}. They don't add up: a video earns the highest one it reaches.`);
    const max = maxPerVideo(terms);
    if (max !== null) lines.push(`${usd(max)} max per video${terms.basePerPost > 0 ? ", base pay included" : ""}. Views past that earn nothing more.`);
  } else if (terms.milestones.length > 0) {
    lines.push(
      `Bonus per post, at the highest milestone it reaches: ${terms.milestones.map((m) => `${views(m.views)} views, ${usd(m.amount)}`).join(" · ")}.`,
    );
    lines.push("Bonuses don't stack. A post that reaches 5K after 1K earns the 5K bonus in total: you are paid the difference.");
  }
  lines.push(`Every post is measured on its own. Only views within ${terms.windowDays} days of the post going live count, then the number is final.`);
  lines.push("Your post has to be on one of your own verified accounts, and go live after you connected that account and joined.");
  if (terms.keepPublicDays > 0) lines.push(`Keep each post public for ${terms.keepPublicDays} days.`);
  if (terms.statementEvery === "month") lines.push("You get one statement a month, for everything you earned that month.");
  lines.push(`After each ${terms.statementEvery === "month" ? "statement" : "payment"}, the brand has ${terms.dueDays ?? STATEMENT_DUE_DAYS} days to pay you directly through your payment link. Amounts are in US dollars, so create your link in USD.`);
  lines.push("Views are updated about once a day.");
  return lines;
}

/**
 * What one unique video would earn at a few view counts, worked out from the campaign's own terms, so a creator sees
 * the sums and not just the rules. Modest counts first, then the first reward.
 */
export function payExamples(terms: PostTerms): string[] {
  if (!terms.cpm?.length && terms.milestones.length === 0) return [];
  const counts = [5_000, 25_000, 100_000];
  const firstReward = [...terms.milestones].sort((a, b) => a.views - b.views)[0];
  if (firstReward && !counts.includes(firstReward.views)) counts.push(firstReward.views);
  return counts
    .filter((n) => !terms.minViews || n >= terms.minViews)
    .map((n) => {
      const viewPay = terms.cpm?.length ? cpmBonus(n, terms.cpm, terms.cpmCap, terms.minViews) : 0;
      const reward = milestoneBonus(n, terms.milestones);
      const total = terms.basePerPost + bonusFor(n, terms);
      const parts = [
        terms.basePerPost > 0 ? `${usd(terms.basePerPost)} base` : null,
        viewPay > 0 ? `${usd(Math.round(viewPay * 100) / 100)} for views` : null,
        reward > 0 ? `${usd(reward)} reward` : null,
      ].filter(Boolean);
      return `A video with ${views(n)} views: ${parts.join(" + ")} = ${usd(Math.round(total * 100) / 100)}.`;
    });
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
