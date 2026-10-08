import { MAX_EXAMPLES, parseExampleLinks, parseLines } from "../src/lib/campaign-brief";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

// formats: one per line
const f = parseLines("Speed challenge\n- Step by step\n• Pain-point hook\n\n  Talking head  \n");
t("one entry per line, bullets and blanks removed", f.ok && f.lines.join("|") === "Speed challenge|Step by step|Pain-point hook|Talking head", f);
t("windows line endings work", parseLines("a\r\nb").ok && (parseLines("a\r\nb") as { lines: string[] }).lines.length === 2);
t("empty is fine and means none", JSON.stringify(parseLines("")) === JSON.stringify({ ok: true, lines: [] }));
t("too many lines is refused", !parseLines(Array.from({ length: 9 }, (_, i) => `line ${i}`).join("\n")).ok);
t("a very long line is refused", !parseLines("x".repeat(161)).ok);

// example videos: full links to real posts
const e = parseExampleLinks("https://www.tiktok.com/@a/video/7391234567890123456?is_from_webapp=1\nhttps://www.instagram.com/reel/C8aBcDeFgHi/?igsh=zz\nhttps://youtu.be/AbC123xyz_-");
t("three platforms, cleaned to their plain links", e.ok && e.urls.join("|") === "https://www.tiktok.com/@a/video/7391234567890123456|https://www.instagram.com/reel/C8aBcDeFgHi/|https://www.youtube.com/shorts/AbC123xyz_-", e);
t("the same video twice is kept once", (() => { const r = parseExampleLinks("https://www.tiktok.com/@a/video/7391234567890123456\nhttps://tiktok.com/@b/video/7391234567890123456?x=1"); return r.ok && r.urls.length === 1; })());
t("empty means none", JSON.stringify(parseExampleLinks("  \n")) === JSON.stringify({ ok: true, urls: [] }));
t("a profile link is refused", !parseExampleLinks("https://www.tiktok.com/@a").ok);
t("a short tiktok link is refused with advice", (() => { const r = parseExampleLinks("https://vm.tiktok.com/ZMabc/"); return !r.ok && /full address/.test(r.error); })());
t("a javascript link is refused", !parseExampleLinks("javascript:alert(1)").ok);
t("an http link is refused", !parseExampleLinks("http://www.tiktok.com/@a/video/7391234567890123456").ok);
t("the error says which line is wrong", (() => { const r = parseExampleLinks("https://www.tiktok.com/@a/video/7391234567890123456\nnot a link"); return !r.ok && r.error.includes("not a link"); })());
t(`more than ${MAX_EXAMPLES} is refused`, !parseExampleLinks(Array.from({ length: 7 }, (_, i) => `https://www.tiktok.com/@a/video/73912345678901234${10 + i}`).join("\n")).ok);
t(`exactly ${MAX_EXAMPLES} is fine`, parseExampleLinks(Array.from({ length: 6 }, (_, i) => `https://www.tiktok.com/@a/video/73912345678901234${10 + i}`).join("\n")).ok);

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
