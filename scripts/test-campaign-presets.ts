import { GETIMG, MEPERSONA, presetFor, presetRow, presetMarker } from "../src/lib/campaign-presets";
import { describePostTerms, postTermsChips, postTermsSchema, termsFor } from "../src/lib/post-terms";
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
  // Pay is agreed with each creator: the campaign shows no pay, and a creator sees their own flat rate per Reel.
  t("pay is agreed per creator", terms.data.agreedPerCreator === true);
  t("the campaign shows no pay", describePostTerms(terms.data).length === 0 && postTermsChips(terms.data).length === 0);
  const mine = termsFor({ ...terms.data, rates: { a1: { basePerPost: 150 } } }, "a1");
  const lines = describePostTerms(mine).join(" ");
  t("a creator sees their own rate", lines.includes("Base pay: $150 for each unique video."), lines);
  t("no view pay for a creator with a rate", !mine.cpm && mine.milestones.length === 0 && !lines.includes("CPM") && !lines.includes("view bonuses"), lines);
  t("a repost isn't paid again", lines.includes("is a repost and isn't paid again"), lines);
  t("no counting window when views don't pay", !lines.includes("Only views within"), lines);
  t("monthly statement, 7 days", lines.includes("one statement a month") && lines.includes("has 7 days"), lines);
  t("views update every 24 hours", lines.includes("Views update once every 24 hours."), lines);
  t("pay strip: rate, then monthly", postTermsChips(mine).join("|") === "$150 per unique video|Paid monthly", postTermsChips(mine));
  t("a creator without a rate sees no pay yet", describePostTerms(termsFor(terms.data, "a2")).length === 0);
}
const steps = parseBriefSteps(MEPERSONA.description);
t("the brief is 5 steps", steps.map((s) => s.title).join("|") === "Read the full brief|Pick a script and make it your own|Your own ideas are welcome|Use MePersona for a few days first|How it works|Get paid monthly", steps);
t("every step has text", steps.every((s) => s.text.length > 20));
t("plain text drops the step marks", !briefPlainText(MEPERSONA.description).includes("##"));
const sc = parseScripts(MEPERSONA.scripts);
t("7 scripts", sc.scripts.length === 7, sc.scripts.map((s) => s.title));
t("no example links in the scripts", sc.scripts.every((s) => s.examples.length === 0));
t("script 1 is GOOD BETTER BEST", sc.scripts[0].title === "1. GOOD BETTER BEST" && MEPERSONA.scripts.includes("Best: MePersona"));
const brief = parseBrief(MEPERSONA.description);
t("only the hooks under the brief", brief.lists.map((l) => l.title).join("|") === "Hooks you can use" && brief.lists[0].items.length === 8, brief.lists);
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
t("the row records the version", (row.post_terms as { preset?: string }).preset === presetMarker(MEPERSONA) && presetMarker(MEPERSONA) === "mepersona@23");
t("the row keeps who reviews", row.post_terms.reviewer === "brand");
t("the row clears formats", row.formats === null);
t("creators apply with a sample video", row.sample_required === true);
t("the sample instructions are set", (row.sample_criteria ?? "").startsWith("Send a short sample video.") && (row.sample_criteria ?? "").includes("recent Reels"));
const parsedRow = postTermsSchema.safeParse(row.post_terms);
t("the saved terms keep the version through parsing", parsedRow.success && parsedRow.data.preset === "mepersona@23", parsedRow);

// Getimg runs like MePersona: no pay on the campaign, agreed with each creator; it keeps the contract and who reviews.
{
  const live = { v: 2, basePerPost: 0, cycleSize: 15, milestones: [], windowDays: 30, keepPublicDays: 90, platforms: ["tiktok"], reviewer: "brand", contract: { agreedAt: "x" } } as never;
  const g = presetRow(GETIMG, live) as Record<string, unknown>;
  const terms = g.post_terms as Record<string, unknown>;
  t("Getimg matches its campaign only", presetFor({ title: "Getimg", about: null }) === GETIMG && presetFor({ title: "MePersona", about: null }) !== GETIMG);
  t("Getimg pay is agreed per creator, with no campaign view pay", terms.agreedPerCreator === true && !terms.cpm && (terms.milestones as unknown[]).length === 0 && terms.reviewer === "brand", terms);
  t("Getimg keeps the brand's agreement", JSON.stringify(terms.contract) === JSON.stringify({ agreedAt: "x" }), terms);
  t("Getimg's setup is marked", terms.preset === `getimg@${GETIMG.version}`, terms);
  t("Getimg sets its example videos, and creators apply with a sample", Array.isArray(g.example_urls) && g.sample_required === true && g.payout_amount === 50, Object.keys(g));
  t("Getimg's brief has no pay figures", !/\$\d+ (for|per)|per 1,000/.test(GETIMG.description.split("### Hooks")[0] + GETIMG.guide), GETIMG.description);
  t("Getimg has 5 scripts", (GETIMG.scripts.match(/^### /gm) ?? []).length === 5);
}

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
