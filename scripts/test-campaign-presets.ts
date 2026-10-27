import { MEPERSONA, presetFor, presetRow, presetMarker } from "../src/lib/campaign-presets";
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
t("script 1 is good, better, best", sc.scripts[0].title === "1. Good, better, best" && MEPERSONA.scripts.includes("Best: MePersona"));
const brief = parseBrief(MEPERSONA.description);
t("formats and hooks under the brief", brief.lists.map((l) => l.title).join("|") === "Formats that work|Hooks you can use" && brief.lists[0].items.length === 5 && brief.lists[1].items.length === 6, brief.lists);
t("the TikTok warning is said once, in the guide, not again above the scripts", !sc.intro.some((b) => b.kind === "warning") && (MEPERSONA.guide.match(/TikTok/g) ?? []).length >= 1);
t("the guide has the platforms warning", parseGuide(MEPERSONA.guide).some((b) => b.kind === "warning"));
const everything = [MEPERSONA.about, MEPERSONA.description, MEPERSONA.guide, MEPERSONA.scripts].join(" ").toLowerCase();
for (const banned of ["#ad", "paid partnership", "tracked link", "no promises", "blur", "family friendly", "bulk posting"])
  t(`nothing about "${banned}"`, !everything.includes(banned));
t("about the brand doesn't say X or Bluesky reply", !/\bx\b|bluesky/i.test(MEPERSONA.about), MEPERSONA.about);
const ex = parseExampleLinks(MEPERSONA.exampleUrls.join("\n"));
t("4 valid example videos", ex.ok && ex.urls.length === 4, ex);
t("matches the MePersona campaign", presetFor({ title: "Creator campaign", about: "Answer every comment… MePersona is an AI inbox" }) === MEPERSONA);
t("doesn't match others", presetFor({ title: "Getimg", about: "AI images" }) === null);

const row = presetRow(MEPERSONA, { reviewer: "brand", contract: undefined });
t("the row records the version", (row.post_terms as { preset?: string }).preset === presetMarker(MEPERSONA) && presetMarker(MEPERSONA) === "mepersona@8");
t("the row keeps who reviews", row.post_terms.reviewer === "brand");
t("the row clears formats", row.formats === null);
t("creators apply with a sample video", row.sample_required === true);
const parsedRow = postTermsSchema.safeParse(row.post_terms);
t("the saved terms keep the version through parsing", parsedRow.success && parsedRow.data.preset === "mepersona@8", parsedRow);

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
