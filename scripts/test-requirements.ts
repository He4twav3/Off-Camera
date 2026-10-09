/** Tests the campaign requirements (src/lib/requirements.ts). Run:  npx tsx scripts/test-requirements.ts */
import { parseRequirements, requirementItems } from "../src/lib/requirements";
import { GETIMG_TERMS } from "../src/lib/post-terms";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const from = (o: Record<string, string>) => (k: string) => o[k] ?? "";

t("all blank means no requirements", (() => { const r = parseRequirements(from({})); return r.ok && r.value === undefined; })());
t("a count with a period", (() => { const r = parseRequirements(from({ req_count: "3", req_period: "week" })); return r.ok && r.value?.count === 3 && r.value.period === "week"; })());
t("an unknown period falls back to week", (() => { const r = parseRequirements(from({ req_count: "2", req_period: "year" })); return r.ok && r.value?.period === "week"; })());
t("a bad count is refused", !parseRequirements(from({ req_count: "0" })).ok && !parseRequirements(from({ req_count: "2.5" })).ok && !parseRequirements(from({ req_count: "abc" })).ok);
t("a length alone is kept", (() => { const r = parseRequirements(from({ req_length: "15 to 30 seconds" })); return r.ok && r.value?.length === "15 to 30 seconds" && r.value.count === undefined; })());
t("a long note is refused", !parseRequirements(from({ req_note: "x".repeat(301) })).ok);

const plain = requirementItems(GETIMG_TERMS);
t("without requirements the platforms still show", plain.length === 1 && plain[0].label === "Post on" && /TikTok/.test(plain[0].value), plain);
const full = requirementItems({ ...GETIMG_TERMS, requirements: { count: 1, period: "day", length: "15 to 30 seconds", note: "Native audio" } });
t("platforms come first, then count, length, note", full.map((i) => i.label).join(",") === "Post on,How many,Length,Also" && full[1].value === "1 video per day", full);
console.log(bad ? `${bad} failed` : "all passed");
process.exit(bad ? 1 : 0);
