import { normaliseHandle } from "../src/lib/handles";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const h = (raw: string, platform: "tiktok" | "instagram" | "youtube_shorts" | "x") => normaliseHandle(raw, platform);

// a plain handle, with or without @
t("tiktok handle", h("maria", "tiktok").handle === "maria");
t("tiktok @handle", h("@maria.ugc", "tiktok").handle === "maria.ugc");
t("instagram handle with spaces around", h("  maria_ugc ", "instagram").handle === "maria_ugc");
t("youtube @handle", h("@MariaMakes", "youtube_shorts").handle === "MariaMakes");

// pasted profile links
t("tiktok link", h("https://www.tiktok.com/@maria.ugc", "tiktok").handle === "maria.ugc");
t("tiktok link with tracking", h("https://www.tiktok.com/@maria?lang=en&is_from_webapp=1", "tiktok").handle === "maria");
t("instagram link", h("https://www.instagram.com/maria_ugc/", "instagram").handle === "maria_ugc");
t("instagram link with query", h("https://www.instagram.com/maria_ugc/?hl=en", "instagram").handle === "maria_ugc");
t("youtube @handle link", h("https://www.youtube.com/@MariaMakes", "youtube_shorts").handle === "MariaMakes");

// YouTube links that don't carry the @handle are refused, with a clear message
for (const link of [
  "https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv",
  "https://www.youtube.com/c/MariaMakes",
  "https://www.youtube.com/user/mariamakes",
  "youtube.com/channel/UCabc",
]) {
  const r = h(link, "youtube_shorts");
  t(`youtube ${link.replace(/^https?:\/\/(www\.)?/, "")} is refused`, !r.ok && /@handle/.test(r.error ?? ""), r);
}

// the wrong platform's link, and rubbish
t("an instagram link on the tiktok button is refused", !h("https://www.instagram.com/maria/", "tiktok").ok);
t("a link to some other site is refused", !h("https://evil.example/@maria", "tiktok").ok);
t("empty is refused", !h("   ", "instagram").ok);
t("illegal characters are refused", !h("ma ria!", "tiktok").ok);
t("too long is refused", !h("a".repeat(40), "instagram").ok);

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
