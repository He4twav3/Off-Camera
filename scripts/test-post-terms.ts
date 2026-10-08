import { GETIMG_TERMS as T, averagePerPost, cycleHistory, describePostTerms, moneyBar, type PostRowData, milestoneBonus, parsePostTerms, payFor, postTermsChips, suggestedStatement, windowEnd, mainPlatformOf, type PostForPay } from "../src/lib/post-terms";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

const now = new Date("2026-09-30T12:00:00Z");
let n = 0;
const post = (p: Partial<PostForPay> = {}): PostForPay => {
  n++;
  return {
    id: `p${String(n).padStart(3, "0")}`, state: "counting", authorVerified: true, views: 0,
    submittedAt: new Date(Date.UTC(2026, 8, 1, 0, n)).toISOString(),
    windowEndsAt: new Date(Date.UTC(2026, 9, 25)).toISOString(), ...p,
  };
};
const many = (count: number, p: Partial<PostForPay> = {}) => Array.from({ length: count }, () => post(p));

// --- milestones don't stack (the contract's own example) -------------------------
const m = T.milestones;
t("under 1,000 views earns nothing", milestoneBonus(999, m) === 0);
t("1,000 views earns $2", milestoneBonus(1000, m) === 2);
t("5,000 views earns $10 in total, not $12", milestoneBonus(5000, m) === 10);
t("the 5,000 tier adds $8 to a post that was at $2", milestoneBonus(5000, m) - milestoneBonus(1000, m) === 8);
t("10,000 views earns $20", milestoneBonus(10_000, m) === 20);
t("100,000 views earns $200, not the sum of all tiers", milestoneBonus(100_000, m) === 200);
t("a huge post stays at the top tier", milestoneBonus(5_000_000, m) === 200);

// --- base pay and cycles ----------------------------------------------------------
const none = payFor(T, [], now);
t("no posts, no pay", none.earned === 0 && none.payable === 0 && none.accruing === 0 && none.cyclesCompleted === 0, none);

const some = payFor(T, many(12), now);
t("12 posts earn $240 so far", some.earned === 240, some);
t("but nothing is due until 15 posts are delivered", some.payable === 0 && some.accruing === 240 && some.cyclesCompleted === 0, some);

const full = payFor(T, many(15), now);
t("15 posts complete a cycle: $300 is due", full.payable === 300 && full.cyclesCompleted === 1, full);
t("the posts are in cycle 1", full.posts.every((p) => p.cycle === 1));

const sixteen = payFor(T, many(16), now);
t("a 16th post starts cycle 2 and isn't due yet", sixteen.payable === 300 && sixteen.accruing === 20 && sixteen.posts[15].cycle === 2, sixteen);
t("30 posts: two cycles, $600 due", payFor(T, many(30), now).payable === 600);

// --- bonuses are due once their window has closed --------------------------------------
const open = payFor(T, [post({ views: 5200 })], now);
t("a bonus is earned while the window is open", open.earned === 20 + 10 && open.accruing === 30, open);
t("but not due while counting continues", open.payable === 0, open);
const closed = payFor(T, [post({ views: 5200, state: "final" })], now);
t("a final post's bonus is due", closed.posts[0].bonus === 10 && closed.posts[0].windowClosed, closed);
t("its base still waits for the cycle", closed.payable === 10, closed);
const lapsed = payFor(T, [post({ views: 1500, windowEndsAt: "2026-09-01T00:00:00Z" })], now);
t("a post whose window has passed counts as closed", lapsed.posts[0].windowClosed === true && lapsed.posts[0].daysLeft === 0, lapsed);

const cycleAndBonus = payFor(T, [...many(14), post({ views: 12_000, state: "final" })], now);
t("a full cycle with one final bonus: base $300 + bonus $20 due", cycleAndBonus.payable === 320, cycleAndBonus);

// --- which posts count ---------------------------------------------------------------------
const mixed = payFor(T, [...many(3), post({ state: "rejected", views: 99_999 }), post({ authorVerified: false, views: 99_999 })], now);
t("a rejected post earns nothing", mixed.counted === 3 && mixed.earned === 60, mixed);
t("a post not found on the creator's own account earns nothing", !mixed.posts.some((p) => p.bonus === 200), mixed);
t("cycles count only posts that count", payFor(T, [...many(14), post({ state: "rejected" })], now).cyclesCompleted === 0);

// --- days left ----------------------------------------------------------------------------
t("days left until the window closes", payFor(T, [post({ windowEndsAt: "2026-10-05T12:00:00Z" })], now).posts[0].daysLeft === 5);
t("an unknown window is shown as unknown, not zero", payFor(T, [post({ windowEndsAt: null })], now).posts[0].daysLeft === null);
t("a window is 30 days after the post goes live", windowEnd(new Date("2026-08-07T00:00:00Z"), 30).toISOString() === "2026-09-06T00:00:00.000Z");

// --- statements ------------------------------------------------------------------------------
t("the first statement is everything due", suggestedStatement({ payable: 300 }, 0) === 300);
t("later statements cover only what is new", suggestedStatement({ payable: 620 }, 300) === 320);
t("never negative", suggestedStatement({ payable: 100 }, 300) === 0);
t("cents stay exact", suggestedStatement({ payable: 0.3 }, 0.1) === 0.2);

// --- the terms themselves -------------------------------------------------------------------------
t("the Getimg terms are valid", parsePostTerms(T) !== null);
t("terms are rejected without a cycle size", parsePostTerms({ ...T, cycleSize: 0 }) === null);
t("terms from the old formula are not mistaken for these", parsePostTerms({ v: 1, videos: 1 }) === null);
t("milestones are sorted lowest first", parsePostTerms({ ...T, milestones: [{ views: 5000, amount: 10 }, { views: 1000, amount: 2 }] })!.milestones[0].views === 1000);

// --- wording -----------------------------------------------------------------------------------
t("chips: base, top bonus, cycle, window", postTermsChips(T).join("|") === "$20 per post|Bonus up to $200 per post|Paid every 15 posts|30-day counting window", postTermsChips(T));
const words = describePostTerms(T).join(" ");
t("the words give the base pay and cycle", /\$20 for each unique video/.test(words) && /every 15 unique videos/.test(words) && /repost/.test(words), words);
t("the words list every milestone", /1K views, \$2/.test(words) && /5K views, \$10/.test(words) && /10K views, \$20/.test(words) && /100K views, \$200/.test(words), words);
t("the words say bonuses don't stack", /don't stack/.test(words));
t("the words give the window, the own-account rule and the update rate", /30 days/.test(words) && /own verified accounts/.test(words) && /once a day/.test(words), words);

// --- the tracking view: money bar, history, average --------------------------------------------------------------
const row = (p: Partial<PostRowData> = {}): PostRowData => ({ ...post(p), platform: "tiktok", url: "https://www.tiktok.com/@a/video/1", rejectReason: null, lastError: null, ...p } as PostRowData);
const rows = (count: number, p: Partial<PostRowData> = {}) => Array.from({ length: count }, () => row(p));

const p15 = payFor(T, many(15), now);
const bar0 = moneyBar(p15, 0);
t("nothing paid yet: all of a finished cycle is due", bar0.paid === 0 && bar0.due === 300 && bar0.counting === 0 && bar0.total === 300, bar0);
const bar1 = moneyBar(p15, 100);
t("part paid: paid, then the rest due", bar1.paid === 100 && bar1.due === 200 && bar1.counting === 0, bar1);
const p20 = payFor(T, many(20), now);
const bar2 = moneyBar(p20, 0);
t("a cycle still filling shows as counting, not due", bar2.due === 300 && bar2.counting === 100 && bar2.total === 400, bar2);
t("the three parts always add up to the total", (() => { const b = moneyBar(p20, 150); return Math.round((b.paid + b.due + b.counting) * 100) === Math.round(b.total * 100); })());
t("paid can't exceed what was earned", moneyBar(p15, 9999).paid === 300 && moneyBar(p15, 9999).due === 0);
t("an empty campaign is all zeros", JSON.stringify(moneyBar(payFor(T, [], now), 0)) === JSON.stringify({ paid: 0, due: 0, counting: 0, total: 0 }));

const hist = cycleHistory(T, rows(37), 0, now);
t("37 posts is three cycles, newest first", hist.map((h) => h.cycle).join() === "3,2,1", hist.map((h) => h.cycle));
t("the unfinished cycle is current, the others unpaid", hist.map((h) => h.status).join() === "current,unpaid,unpaid", hist.map((h) => h.status));
t("each finished cycle holds 15 posts and earned $300", hist[1].posts === 15 && hist[1].earned === 300 && hist[0].posts === 7 && hist[0].earned === 140, hist);
const hist2 = cycleHistory(T, rows(37), 300, now);
t("payments cover the oldest cycle first", hist2.map((h) => h.status).join() === "current,unpaid,paid", hist2.map((h) => h.status));
t("a cycle only counts as paid when payments cover all of it", cycleHistory(T, rows(15), 299.99, now)[0].status === "unpaid");
t("bonuses count toward a cycle's earnings", cycleHistory(T, rows(15, { views: 5200, state: "final" }), 0, now)[0].earned === 15 * 30, cycleHistory(T, rows(15, { views: 5200, state: "final" }), 0, now)[0].earned);
t("no posts, no history", cycleHistory(T, [], 0, now).length === 0);
t("views are added up per cycle", cycleHistory(T, rows(3, { views: 1000 }), 0, now)[0].views === 3000);

t("average per post", averagePerPost({ earned: 773, counted: 37 }) === 20.89);
t("average with no posts is zero, not a crash", averagePerPost({ earned: 0, counted: 0 }) === 0);

// --- one unique video + reposts: the base is earned on the main platform only ---
{
  const now = new Date("2026-10-20T12:00:00Z");
  const post = (id: string, platform: string, views: number, at: string) =>
    ({ id, platform, state: "counting" as const, authorVerified: true, views, submittedAt: at, windowEndsAt: "2026-11-05T00:00:00Z" });
  const ig1 = post("ig1", "instagram", 800, "2026-10-10T10:00:00Z");
  const yt1 = post("yt1", "youtube_shorts", 900, "2026-10-10T11:00:00Z");
  const tt1 = post("tt1", "tiktok", 700, "2026-10-10T12:00:00Z");
  const one = payFor(T, [ig1, yt1, tt1], now);
  t("the same video on three platforms earns the base once", one.earned === 20 && one.counted === 3 && one.unique === 1, one);
  t("the first post sets the main platform", mainPlatformOf(T, [ig1, yt1, tt1]) === "instagram");
  t("reposts are marked and earn no base", one.posts.filter((p) => p.repost).length === 2 && one.posts.find((p) => p.id === "yt1")!.base === 0, one.posts);
  const two = payFor(T, [ig1, yt1, tt1, post("ig2", "instagram", 100, "2026-10-12T10:00:00Z")], now);
  t("a second unique video on the main platform earns the base again", two.earned === 40 && two.unique === 2, two);
  const bonus = payFor(T, [post("ig1", "instagram", 1200, "2026-10-10T10:00:00Z"), post("yt1", "youtube_shorts", 5400, "2026-10-10T11:00:00Z")], now);
  t("a repost keeps its own view bonus", bonus.earned === 20 + 2 + 10, bonus);
  const fifteen = Array.from({ length: 14 }, (_, i) => post(`u${i}`, "instagram", 0, `2026-10-${String(i + 1).padStart(2, "0")}T10:00:00Z`));
  const noCycle = payFor(T, [...fifteen, post("r1", "tiktok", 0, "2026-10-16T10:00:00Z"), post("r2", "youtube_shorts", 0, "2026-10-16T11:00:00Z")], now);
  t("reposts don't count toward the 15 unique videos", noCycle.cyclesCompleted === 0 && noCycle.unique === 14, noCycle);
  const yes = payFor(T, [...fifteen, post("u14", "instagram", 0, "2026-10-15T10:00:00Z"), post("r1", "tiktok", 0, "2026-10-16T10:00:00Z")], now);
  t("15 unique videos complete a cycle even with reposts", yes.cyclesCompleted === 1 && yes.unique === 15, yes);
  const rej = payFor(T, [{ ...ig1, state: "rejected" as const }, yt1, tt1], now);
  t("if the first post is rejected the next one sets the main platform", mainPlatformOf(T, [{ ...ig1, state: "rejected" as const }, yt1, tt1]) === "youtube_shorts" && rej.earned === 20, rej);
  const everyPost = payFor({ ...T, repostsEarnBase: true }, [ig1, yt1, tt1], now);
  t("a contract that pays every post pays all three", everyPost.earned === 60 && mainPlatformOf({ repostsEarnBase: true }, [ig1]) === null, everyPost);
  t("older terms without the setting mean one unique video", parsePostTerms({ v: 2, basePerPost: 20, cycleSize: 15, milestones: [], windowDays: 30, keepPublicDays: 90, platforms: ["tiktok"] })!.repostsEarnBase === false);
}

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
