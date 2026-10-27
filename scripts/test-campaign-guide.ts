import { guideWarnings, inlineText, parseGuide, parseInline, parseScripts } from "../src/lib/campaign-guide";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

// bold inside a line
t("bold runs", JSON.stringify(parseInline("a **b** c")) === JSON.stringify([{ text: "a ", bold: false }, { text: "b", bold: true }, { text: " c", bold: false }]));
t("an unclosed ** stays as typed", inlineText(parseInline("a ** b")) === "a ** b");

// the guide
const g = parseGuide(
  "## What it is\nMePersona is an AI\nthat talks like you.\n\n! **TikTok:** posts only. Never say it replies.\n- one\n- two\n1. first\n2. second\nExample: https://www.tiktok.com/@a/video/1 for the hook\nExample: http://insecure.example\n### Small",
);
t("heading", g[0]?.kind === "heading" && g[0].level === 2 && g[0].text === "What it is", g[0]);
t("lines join into one paragraph until a blank line", g[1]?.kind === "paragraph" && inlineText(g[1].text) === "MePersona is an AI that talks like you.", g[1]);
t("a ! line is a warning, bold kept", g[2]?.kind === "warning" && g[2].text[0].bold && inlineText(g[2].text) === "TikTok: posts only. Never say it replies.", g[2]);
t("bullets make one list", g[3]?.kind === "list" && !g[3].ordered && g[3].items.length === 2, g[3]);
t("numbers make an ordered list", g[4]?.kind === "list" && g[4].ordered && g[4].items.length === 2, g[4]);
t("an example link with its note", g[5]?.kind === "example" && g[5].url === "https://www.tiktok.com/@a/video/1" && g[5].note === "for the hook", g[5]);
t("an http example is just text, never a link", g[6]?.kind === "paragraph", g[6]);
t("### is a small heading", g[7]?.kind === "heading" && g[7].level === 3, g[7]);
t("warnings are collected for the page", guideWarnings(g).length === 1);
t("windows line endings work", parseGuide("a\r\n\r\nb").length === 2);
t("empty means nothing", parseGuide("  \n\n").length === 0);

// the scripts
const s = parseScripts(
  "Make each format your own.\n\n### 1. Tool rating\nExample: https://www.tiktok.com/@x/video/2\n- Hook: rate the tools\n- CapCut: good\n\n### 2. Batching\nExample: https://www.tiktok.com/@y/video/3 hook\nExample: https://www.tiktok.com/@z/video/4 format\n! Never say it replies to TikTok comments.\n- Hook: why aren't more people doing this?",
);
t("text before the first script is the intro", s.intro.length === 1 && s.intro[0].kind === "paragraph", s.intro);
t("two scripts with their titles", s.scripts.map((x) => x.title).join("|") === "1. Tool rating|2. Batching", s.scripts);
t("examples are pulled out of the body", s.scripts[1].examples.length === 2 && s.scripts[1].examples[1].note === "format" && s.scripts[1].body.every((b) => b.kind !== "example"), s.scripts[1]);
t("the script body keeps its list and warning", s.scripts[1].body.map((b) => b.kind).join(",") === "warning,list", s.scripts[1].body);
t("no ### means no scripts", parseScripts("- just a list").scripts.length === 0);

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
