/** Tests the brand's numbers (src/lib/brand-stats.ts). Run:  npx tsx scripts/test-brand-stats.ts */
import { cpm, leaderboard, platformSplit, topPosts, type StatCreator, type StatPost } from "../src/lib/brand-stats";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const post = (id: string, platform: string, views: number, earned = 20, counted = true): StatPost => ({ id, platform, views, counted, earned });

t("cost per 1,000 views", cpm(100, 50_000) === 2, cpm(100, 50_000));
t("no views means no cost per view", cpm(100, 0) === null);
t("cost rounds to cents", cpm(33, 7_000) === 4.71, cpm(33, 7_000));

const split = platformSplit([post("a", "instagram", 1000), post("b", "tiktok", 5000), post("c", "instagram", 500), post("d", "tiktok", 9999, 20, false)]);
t("views split by platform, most first, only counted posts", split[0].platform === "tiktok" && split[0].views === 5000 && split[1].views === 1500 && split.length === 2, split);

const creators: StatCreator[] = [
  { applicantId: "u1", name: "Maya", handle: "maya", posts: [post("a", "instagram", 8000, 30), post("b", "tiktok", 2000, 22)] },
  { applicantId: "u2", name: "Leo", handle: "leo", posts: [post("c", "tiktok", 12000, 40)] },
  { applicantId: "u3", name: "Ana", handle: "ana", posts: [post("d", "tiktok", 500, 20, false)] },
  { applicantId: "u1", name: "Maya", handle: "maya", posts: [post("e", "youtube_shorts", 4000, 22)] },
];
const board = leaderboard(creators);
t("ranked by views, one row per creator across campaigns", board.length === 2 && board[0].name === "Maya" && board[0].views === 14000 && board[0].rank === 1 && board[1].name === "Leo" && board[1].rank === 2, board);
t("a creator with nothing counted is left off", !board.some((r) => r.name === "Ana"), board);
t("best post and average are worked out", board[0].bestPost === 8000 && board[0].avgViews === Math.round(14000 / 3) && board[0].posts === 3, board[0]);
t("earnings add up", board[0].earned === 74, board[0]);
const tie = leaderboard([
  { applicantId: "a", name: "Zed", handle: "z", posts: [post("1", "tiktok", 100, 20)] },
  { applicantId: "b", name: "Amy", handle: "a", posts: [post("2", "tiktok", 100, 20)] },
]);
t("a tie is broken by name so the order is stable", tie[0].name === "Amy" && tie[1].name === "Zed", tie);

const top = topPosts([post("a", "tiktok", 10), post("b", "tiktok", 900), post("c", "tiktok", 500, 20, false), post("d", "tiktok", 300)], 2);
t("top posts are the most viewed that count", top.map((p) => p.id).join() === "b,d", top);

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
