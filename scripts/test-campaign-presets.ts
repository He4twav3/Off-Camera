import { GETIMG, MEPERSONA, presetFor, presetRow, presetMarker } from "../src/lib/campaign-presets";
import { describePostTerms, postTermsChips, postTermsSchema } from "../src/lib/post-terms";
import { parseBrief, parseBriefSteps, parseGuide, parseScripts, briefPlainText } from "../src/lib/campaign-guide";
import { parseExampleLinks } from "../src/lib/campaign-brief";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

const terms = postTermsSchema.safeParse({ ...MEPERSONA.postTerms, reviewer: "oncamera" });
t("the pay terms are valid", terms.success, terms);
if (terms.success) {
  const lines = describePostTerms(terms.data).join(" ");
  t("$5 for each unique video", lines.includes("Base pay: $5 for each unique video."), lines);
  t("reposts earn view pay only", lines.includes("it earns view bonuses only"), lines);
  t("$2 per 1,000 views", lines.includes("$2 CPM"), lines);
  t("counted up to 100K views", lines.includes("up to 100K views"), lines);
  t("rewards 100/300/500", lines.includes("$100 at 250K views, $300 at 500K views, $500 at 1M views"), lines);
  t("$705 max per video", lines.includes("$705 max per video"), lines);
  t("no minimum views", !lines.includes("starts earning view pay once"), lines);
  t("no keep-public rule", !lines.includes("Keep each post public"), lines);
  t("monthly statement, 7 days", lines.includes("one statement a month") && lines.includes("has 7 days"), lines);
  t("pay strip says per unique video", postTermsChips(terms.data)[0] === "$5 per unique video", postTermsChips(terms.data));
}
const steps = parseBriefSteps(MEPERSONA.description);
t("the brief is 5 steps", steps.map((s) => s.title).join("|") === "Read the full brief|Pick a script and make it your own|Your own ideas are welcome|Use MePersona for a few days first|Get paid monthly", steps);
t("every step has text", steps.every((s) => s.text.length > 20));
t("plain text drops the step marks", !briefPlainText(MEPERSONA.description).includes("##"));
const sc = parseScripts(MEPERSONA.scripts);
t("5 scripts", sc.scripts.length === 5, sc.scripts.map((s) => s.title));
t("no example links in the scripts", sc.scripts.every((s) => s.examples.length === 0));
t("script 1 is GOOD BETTER BEST", sc.scripts[0].title === "1. GOOD BETTER BEST" && MEPERSONA.scripts.includes("Best: MePersona"));
const brief = parseBrief(MEPERSONA.description);
t("only the hooks under the brief", brief.lists.map((l) => l.title).join("|") === "Hooks you can use" && brief.lists[0].items.length === 6, brief.lists);
t("step 1 doesn't list the scripts again", steps[0].text === "It explains what MePersona is and what it does, and has scripts you can use.", steps[0]);
t("the TikTok warning is said once, in the guide, not again above the scripts", !sc.intro.some((b) => b.kind === "warning") && (MEPERSONA.guide.match(/TikTok/g) ?? []).length >= 1);
t("which account to use is its own part of the scripts intro, in bold", (() => { const i = sc.intro.findIndex((b) => b.kind === "heading" && b.text === "Which account to use"); const next = sc.intro[i + 1]; return i > 0 && next?.kind === "paragraph" && next.text[0].bold; })(), sc.intro);
t("the guide has the platforms warning", parseGuide(MEPERSONA.guide).some((b) => b.kind === "warning"));
const everything = [MEPERSONA.about, MEPERSONA.description, MEPERSONA.guide, MEPERSONA.scripts].join(" ").toLowerCase();
for (const banned of ["#ad", "paid partnership", "tracked link", "no promises", "blur", "family friendly", "bulk posting"])
  t(`nothing about "${banned}"`, !everything.includes(banned));
t("about the brand doesn't say X or Bluesky reply", !/\bx\b|bluesky/i.test(MEPERSONA.about), MEPERSONA.about);
const ex = parseExampleLinks((MEPERSONA.exampleUrls ?? []).join("\n"));
t("4 valid example videos", ex.ok && ex.urls.length === 4, ex);
t("matches the MePersona campaign", presetFor({ title: "Creator campaign", about: "Answer every comment… MePersona is an AI inbox" }) === MEPERSONA);
t("doesn't match others", presetFor({ title: "Acme", about: "AI images" }) === null);

const row = presetRow(MEPERSONA, { reviewer: "brand", contract: undefined });
t("the row records the version", (row.post_terms as { preset?: string }).preset === presetMarker(MEPERSONA) && presetMarker(MEPERSONA) === "mepersona@19");
t("the row keeps who reviews", row.post_terms.reviewer === "brand");
t("the row clears formats", row.formats === null);
t("creators apply with a sample video", row.sample_required === true);
t("the sample instructions are set", (row.sample_criteria ?? "").startsWith("Send a short sample video."));
const parsedRow = postTermsSchema.safeParse(row.post_terms);
t("the saved terms keep the version through parsing", parsedRow.success && parsedRow.data.preset === "mepersona@19", parsedRow);

// Getimg's setup keeps the campaign's own pay terms, contract, example videos and sample setting.
{
  const live = { v: 2, basePerPost: 0, cycleSize: 15, milestones: [], windowDays: 30, keepPublicDays: 90, platforms: ["tiktok"], reviewer: "brand", contract: { agreedAt: "x" } } as never;
  const g = presetRow(GETIMG, live) as Record<string, unknown>;
  const terms = g.post_terms as Record<string, unknown>;
  t("Getimg matches its campaign only", presetFor({ title: "Getimg", about: null }) === GETIMG && presetFor({ title: "MePersona", about: null }) !== GETIMG);
  t("Getimg keeps its pay terms", terms.basePerPost === 0 && terms.cycleSize === 15 && terms.reviewer === "brand", terms);
  t("Getimg keeps the brand's agreement", JSON.stringify(terms.contract) === JSON.stringify({ agreedAt: "x" }), terms);
  t("Getimg's setup is marked", terms.preset === "getimg@1", terms);
  t("Getimg keeps its videos, sample setting and payout", !("example_urls" in g) && !("sample_required" in g) && !("payout_amount" in g), Object.keys(g));
  t("Getimg's brief has 5 points and 5 hooks", (GETIMG.description.match(/^## /gm) ?? []).length === 5 && (GETIMG.description.match(/^- /gm) ?? []).length === 5);
  t("Getimg has 5 scripts", (GETIMG.scripts.match(/^### /gm) ?? []).length === 5);
}

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
