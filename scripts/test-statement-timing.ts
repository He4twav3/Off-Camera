import { describePostTerms, postTermsSchema } from "../src/lib/post-terms";
import { mergePayTerms, parsePayTermsFields } from "../src/lib/pay-terms-form";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

const form = (extra: Record<string, string>) => {
  const f: Record<string, string> = { base: "5", cycle: "1", window: "30", keep_public: "90", cpm_from: "0", cpm_rate: "2", ...extra };
  return parsePayTermsFields((k) => f[k] ?? "", (k) => (k === "platforms" ? ["tiktok"] : f[k] !== undefined ? [f[k]] : []));
};
const base = { v: 2 as const, basePerPost: 5, cycleSize: 1, milestones: [], windowDays: 30, keepPublicDays: 90, platforms: ["tiktok" as const], repostsEarnBase: false, reviewer: "oncamera" as const };

const monthly = form({ statement_every: "month", due_days: "7" });
t("admin form reads monthly and 7 days", monthly.ok && monthly.value.statementEvery === "month" && monthly.value.dueDays === 7, monthly);
t("days out of range are refused", !form({ due_days: "0" }).ok && !form({ due_days: "91" }).ok && !form({ due_days: "2.5" }).ok);
const brand = form({});
t("the brand's form, without the fields, leaves them unset", brand.ok && brand.value.statementEvery === undefined && brand.value.dueDays === undefined);
if (brand.ok) {
  const kept = mergePayTerms({ ...base, statementEvery: "month" as const, dueDays: 7 }, brand.value);
  t("saving the brand's form keeps monthly and 7 days", kept.statementEvery === "month" && kept.dueDays === 7, kept);
}
if (monthly.ok) {
  const parsed = postTermsSchema.safeParse({ ...mergePayTerms(base, monthly.value) });
  t("the saved terms are valid", parsed.success, parsed);
  if (parsed.success) {
    const lines = describePostTerms(parsed.data).join(" ");
    t("the brief says one statement a month", lines.includes("one statement a month"), lines);
    t("the brief says 7 days", lines.includes("has 7 days to pay"), lines);
    t("no per-video payment wording when monthly", !lines.includes("It is paid after"), lines);
  }
}
const plain = describePostTerms(base).join(" ");
t("without the settings, the standard wording stays", plain.includes("It is paid after each unique video") && plain.includes("has 14 days"), plain);

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
