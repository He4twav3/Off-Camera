/**
 * Tests the creator-video rules (src/lib/creator-videos.ts): which platform a
 * link belongs to, which links are accepted as videos, and the picking limits.
 * Run:  npx tsx scripts/test-creator-videos.ts
 */
import { detectPlatform, parseVideoLink, pickVideoIds, MAX_APPLICATION_VIDEOS, MAX_PROFILE_VIDEOS } from "../src/lib/creator-videos";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

t("limits match the database", MAX_PROFILE_VIDEOS === 12 && MAX_APPLICATION_VIDEOS === 5);

// which platform
t("TikTok", detectPlatform("https://www.tiktok.com/@maria/video/123") === "tiktok");
t("TikTok short link", detectPlatform("https://vm.tiktok.com/ZMabc123/") === "tiktok");
t("Instagram", detectPlatform("https://www.instagram.com/reel/AbC123xyz/") === "instagram");
t("YouTube", detectPlatform("https://www.youtube.com/shorts/AbC123xyz") === "youtube_shorts");
t("youtu.be", detectPlatform("https://youtu.be/AbC123xyz") === "youtube_shorts");
t("X", detectPlatform("https://x.com/maria/status/123") === "x");
t("Twitter address still counts as X", detectPlatform("https://twitter.com/maria/status/123") === "x");
t("another site is not recognised", detectPlatform("https://example.com/video/1") === null);
t("a look-alike host is not recognised", detectPlatform("https://tiktok.com.evil.example/@a/video/1") === null && detectPlatform("https://eviltiktok.com/@a/video/1") === null);
t("not a link at all", detectPlatform("hello") === null);

// accepted as a video
const ok = (u: string) => parseVideoLink(u).ok;
t("a real TikTok post is accepted", ok("https://www.tiktok.com/@maria/video/1234567890"));
t("a real Instagram reel is accepted", ok("https://www.instagram.com/reel/AbC123xyz/"));
t("a real YouTube short is accepted", ok("https://www.youtube.com/shorts/AbC123xyz"));
t("a real X post is accepted", ok("https://x.com/maria/status/1234567890"));
t("the platform is reported", (() => { const r = parseVideoLink("https://www.instagram.com/reel/AbC123xyz/"); return r.ok && r.platform === "instagram"; })());
t("surrounding spaces are fine", ok("  https://www.tiktok.com/@maria/video/1234567890  "));
t("empty is refused with a clear message", (() => { const r = parseVideoLink(""); return !r.ok && r.error.includes("Paste"); })());
t("a profile page is refused (not a post)", !ok("https://www.tiktok.com/@maria") && !ok("https://www.instagram.com/maria/"));
t("http (not https) is refused", !ok("http://www.tiktok.com/@maria/video/1234567890"));
t("javascript: is refused", !ok("javascript:alert(1)"));
t("data: is refused", !ok("data:text/html,<script>alert(1)</script>"));
t("another site is refused, naming the supported ones", (() => { const r = parseVideoLink("https://example.com/a"); return !r.ok && r.error.includes("TikTok") && r.error.includes("Instagram"); })());
t("a Google Drive link is not a profile video", !ok("https://drive.google.com/file/d/abc/view"));
t("a very long link is refused", !ok("https://www.tiktok.com/@maria/video/1234567890?x=" + "a".repeat(600)));

// picking
t("picking none is refused", !pickVideoIds([]).ok && !pickVideoIds(["", "  "]).ok);
t("picking one works", (() => { const r = pickVideoIds(["a"]); return r.ok && r.ids.length === 1; })());
t("duplicates collapse", (() => { const r = pickVideoIds(["a", "a", "b"]); return r.ok && r.ids.join() === "a,b"; })());
t("five is allowed", pickVideoIds(["1", "2", "3", "4", "5"]).ok);
t("six is refused", !pickVideoIds(["1", "2", "3", "4", "5", "6"]).ok);

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
