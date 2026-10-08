import { judgePost, parseInstagram, parseTikTok, parseYouTube } from "../src/lib/post-reading";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

// --- reading what the services return ---------------------------------------------------
const tt = parseTikTok({ playCount: 18400, authorMeta: { name: "MariaMakes" }, createTimeISO: "2026-08-10T09:30:00.000Z" });
t("tiktok views", tt.views === 18400, tt);
t("tiktok author is lowercase", tt.author === "mariamakes", tt);
t("tiktok posted date", tt.postedAt === "2026-08-10T09:30:00.000Z", tt);
t("tiktok date from a unix timestamp in seconds", parseTikTok({ createTime: 1786354200 }).postedAt === "2026-08-10T09:30:00.000Z");
t("tiktok with nothing readable", JSON.stringify(parseTikTok({})) === JSON.stringify({ views: 0, author: null, postedAt: null }));

const ig = parseInstagram({ videoPlayCount: 5200, ownerUsername: "Maria.Rivers", timestamp: "2026-08-12T10:00:00.000Z" });
t("instagram views, author, date", ig.views === 5200 && ig.author === "maria.rivers" && ig.postedAt === "2026-08-12T10:00:00.000Z", ig);
t("instagram falls back to the other views field", parseInstagram({ videoViewCount: 77 }).views === 77);

const yt = parseYouTube({ snippet: { publishedAt: "2026-08-15T12:00:00Z" }, statistics: { viewCount: "9300" } }, "@MariaMakes");
t("youtube views come as text and are read as a number", yt.views === 9300, yt);
t("youtube author is the channel handle without @", yt.author === "mariamakes", yt);
t("youtube without a channel handle has no author", parseYouTube({ statistics: { viewCount: "1" } }, undefined).author === null);

t("junk views become zero", parseTikTok({ playCount: "lots" }).views === 0 && parseTikTok({ playCount: -5 }).views === 0);
t("a broken date is null, not a crash", parseInstagram({ timestamp: "yesterday" }).postedAt === null);

// --- does the post count for this creator ----------------------------------------------------
const joined = new Date("2026-08-07T00:00:00Z");
const verified = "2026-08-01T00:00:00Z"; // the account was connected before joining
const mine = [{ handle: "mariamakes", verifiedAt: verified }];
const ok = { views: 100, author: "mariamakes", postedAt: "2026-08-10T09:30:00.000Z" };
t("on their own account, after joining and connecting: counts", judgePost({ reading: ok, ownAccounts: mine, joinedAt: joined }).kind === "verified");
t("handles are compared without @ and case", judgePost({ reading: ok, ownAccounts: [{ handle: "@MariaMakes", verifiedAt: verified }], joinedAt: joined }).kind === "verified");
t("any one of their verified accounts is fine", judgePost({ reading: ok, ownAccounts: [{ handle: "other", verifiedAt: verified }, ...mine], joinedAt: joined }).kind === "verified");

const stolen = judgePost({ reading: { ...ok, author: "viralguy" }, ownAccounts: mine, joinedAt: joined });
t("someone else's video is rejected", stolen.kind === "rejected", stolen);
t("and the reason names the account", stolen.kind === "rejected" && stolen.reason.includes("@viralguy"), stolen);
t("with no verified accounts nothing counts", judgePost({ reading: ok, ownAccounts: [], joinedAt: joined }).kind === "rejected");

const old = judgePost({ reading: { ...ok, postedAt: "2026-08-04T00:00:00.000Z" }, ownAccounts: mine, joinedAt: joined });
t("a video posted before joining is rejected", old.kind === "rejected" && /before you joined/.test(old.reason), old);
t("posted at the very moment of joining counts", judgePost({ reading: { ...ok, postedAt: "2026-08-07T00:00:00.000Z" }, ownAccounts: mine, joinedAt: joined }).kind === "verified");

// the account has to have been connected before the post went live
const lateAccount = [{ handle: "mariamakes", verifiedAt: "2026-08-12T00:00:00Z" }];
const beforeConnect = judgePost({ reading: ok, ownAccounts: lateAccount, joinedAt: joined });
t("a post made before the account was connected is rejected, even after joining", beforeConnect.kind === "rejected" && /before you connected/.test(beforeConnect.reason), beforeConnect);
t("a post made after the account was connected counts", judgePost({ reading: { ...ok, postedAt: "2026-08-13T00:00:00.000Z" }, ownAccounts: lateAccount, joinedAt: joined }).kind === "verified");
t("only the account that posted it matters", judgePost({ reading: ok, ownAccounts: [{ handle: "mariamakes", verifiedAt: verified }, { handle: "second", verifiedAt: "2026-09-01T00:00:00Z" }], joinedAt: joined }).kind === "verified");
t("connecting at the very moment of posting counts", judgePost({ reading: ok, ownAccounts: [{ handle: "mariamakes", verifiedAt: ok.postedAt }], joinedAt: joined }).kind === "verified");

t("unknown author waits instead of rejecting", judgePost({ reading: { ...ok, author: null }, ownAccounts: mine, joinedAt: joined }).kind === "pending");
t("unknown date waits instead of rejecting", judgePost({ reading: { ...ok, postedAt: null }, ownAccounts: mine, joinedAt: joined }).kind === "pending");

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
