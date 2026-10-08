import { postIdentity } from "../src/lib/post-key";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const key = (u: string) => {
  const r = postIdentity(u);
  return r.ok ? r.key : null;
};

// the same post, however it is linked
t("tiktok", key("https://www.tiktok.com/@maria/video/7391234567890123456") === "tiktok:7391234567890123456");
t("tiktok with tracking parameters", key("https://www.tiktok.com/@maria/video/7391234567890123456?is_from_webapp=1&sender_device=pc") === "tiktok:7391234567890123456");
t("tiktok without www", key("https://tiktok.com/@maria/video/7391234567890123456") === "tiktok:7391234567890123456");
t("tiktok photo post", key("https://www.tiktok.com/@maria/photo/7391234567890123456") === "tiktok:7391234567890123456");
t("a different username on the same id is the same post", key("https://www.tiktok.com/@someoneelse/video/7391234567890123456") === "tiktok:7391234567890123456");
t("instagram reel", key("https://www.instagram.com/reel/C8aBcDeFgHi/") === "instagram:C8aBcDeFgHi");
t("instagram reel with tracking", key("https://www.instagram.com/reel/C8aBcDeFgHi/?igsh=abc123") === "instagram:C8aBcDeFgHi");
t("instagram post with a username in the path", key("https://www.instagram.com/maria/p/C8aBcDeFgHi/") === "instagram:C8aBcDeFgHi");
t("instagram codes are case sensitive", key("https://www.instagram.com/reel/abcde/") !== key("https://www.instagram.com/reel/ABCDE/"));
t("youtube short", key("https://www.youtube.com/shorts/AbC123xyz_-") === "youtube_shorts:AbC123xyz_-");
t("youtube watch link", key("https://www.youtube.com/watch?v=AbC123xyz_-&t=5s") === "youtube_shorts:AbC123xyz_-");
t("youtu.be link", key("https://youtu.be/AbC123xyz_-?si=xyz") === "youtube_shorts:AbC123xyz_-");
t("m.youtube.com", key("https://m.youtube.com/shorts/AbC123xyz_-") === "youtube_shorts:AbC123xyz_-");
t("a short and a watch link to one video give one key", key("https://www.youtube.com/shorts/AbC123xyz_-") === key("https://youtu.be/AbC123xyz_-"));

// refused
for (const [name, u] of [
  ["short tiktok link", "https://vm.tiktok.com/ZMabc123/"],
  ["another short tiktok link", "https://www.tiktok.com/t/ZTabc123/"],
  ["a tiktok profile", "https://www.tiktok.com/@maria"],
  ["an instagram profile", "https://www.instagram.com/maria/"],
  ["a youtube channel", "https://www.youtube.com/@maria"],
  ["a youtube link with a bad id", "https://www.youtube.com/watch?v=short"],
  ["http, not https", "http://www.tiktok.com/@maria/video/7391234567890123456"],
  ["another site", "https://evil.example/@maria/video/7391234567890123456"],
  ["a javascript link", "javascript:alert(1)"],
  ["not a link", "my video"],
  ["an x post", "https://x.com/maria/status/123456789"],
] as const) t(`${name} is refused`, postIdentity(u).ok === false, postIdentity(u));
t("the short-link message says what to do", /full address/.test((postIdentity("https://vm.tiktok.com/ZMabc/") as { error: string }).error));
t("the canonical link has no tracking", (postIdentity("https://www.instagram.com/reel/C8aBcDeFgHi/?igsh=zz") as { url: string }).url === "https://www.instagram.com/reel/C8aBcDeFgHi/");

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
