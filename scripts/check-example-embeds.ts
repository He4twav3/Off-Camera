/**
 * Checks that every example video in the campaign setups (lib/campaign-presets.ts) can be played on the site: TikTok's
 * oEmbed has to hand back its official embed, and Instagram has to serve the post's embed page. Run it after changing
 * any example link: npx tsx scripts/check-example-embeds.ts (needs the internet).
 */
import { CAMPAIGN_PRESETS } from "../src/lib/campaign-presets";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

async function main() {
  for (const preset of CAMPAIGN_PRESETS) {
    for (const url of (preset.exampleUrls ?? [])) {
      if (url.includes("tiktok.com")) {
        const res = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        ).catch(() => null);
        const data = res?.ok ? ((await res.json()) as { html?: string }) : null;
        t(
          `${preset.key}: ${url} has TikTok's official embed`,
          Boolean(
            data?.html?.includes("blockquote") ||
            data?.html?.includes("iframe"),
          ),
          res?.status,
        );
      } else if (url.includes("instagram.com")) {
        const code = /\/(?:p|reel|reels)\/([^/?#]+)/.exec(url)?.[1];
        const res = await fetch(
          `https://www.instagram.com/p/${code}/embed/captioned/`,
        ).catch(() => null);
        const html = res?.ok ? await res.text() : "";
        t(
          `${preset.key}: ${url} has Instagram's embed page`,
          Boolean(code) &&
            html.length > 1000 &&
            !/may have been removed/i.test(html),
          res?.status,
        );
      }
    }
  }
}

main().then(() => {
  console.log(bad ? `\n${bad} FAILED` : "\nall passed");
  process.exit(bad ? 1 : 0);
});
