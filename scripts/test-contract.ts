/** Tests the campaign contract text (src/lib/contract.ts). Run:  npx tsx scripts/test-contract.ts */
import { contractSections, contractStatus, contractWordHtml, termsFingerprint } from "../src/lib/contract";
import { GETIMG_TERMS } from "../src/lib/post-terms";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const text = (s: ReturnType<typeof contractSections>) => s.map((x) => `${x.heading}\n${x.lines.join("\n")}`).join("\n");

const blank = text(contractSections({ campaign: "Getimg", agency: "OnCamera", terms: GETIMG_TERMS }));
t("blanks show for what the brand hasn't filled in", blank.includes("[brand legal name]") && blank.includes("[address]"), blank.slice(0, 200));
t("the pay figures come from the terms", blank.includes("$20") && blank.includes("$200") && blank.includes("100K views"), blank);
t("it says the brand pays the creator directly", /pays the creator directly/.test(blank) && /never holds the money/.test(blank));
t("the lawyer gaps are marked", /to be written by the reviewing lawyer/.test(blank));
const filled = text(contractSections({ campaign: "Getimg", agency: "OnCamera", terms: GETIMG_TERMS, brand: { legalName: "Getimg sp. z o.o.", address: "ul. Prosta 1, Warszawa", country: "Poland", signatory: "Sam Rivers", signatoryRole: "CEO" } }));
t("brand details fill the blanks", filled.includes("Getimg sp. z o.o.") && filled.includes("governed by the law of Poland") && filled.includes("Sam Rivers, CEO") && !filled.includes("[brand legal name]"), filled.slice(0, 200));
t("a brand-approved campaign says the brand approves", /The brand approves each video/.test(text(contractSections({ campaign: "X", agency: "OnCamera", terms: { ...GETIMG_TERMS, reviewer: "brand" } }))));

const contract = { legalName: "Getimg", address: "Warszawa 1", country: "Poland", signatory: "Sam", signatoryRole: "", agreedAt: "2026-10-09T00:00:00Z", agreedByEmail: "s@g.com", terms: termsFingerprint(GETIMG_TERMS) };
t("no contract is 'none'", contractStatus(GETIMG_TERMS) === "none");
t("matching terms are 'signed'", contractStatus({ ...GETIMG_TERMS, contract }) === "signed");
t("changed pay terms are 'changed'", contractStatus({ ...GETIMG_TERMS, basePerPost: 25, contract }) === "changed");
t("the reviewer is not part of what must be re-signed", contractStatus({ ...GETIMG_TERMS, reviewer: "brand", contract }) === "signed");
t("a contract signed before CPM existed is still current", contractStatus({ ...GETIMG_TERMS, contract: { ...contract, terms: JSON.stringify({ b: 20, c: 15, m: [[1000, 2], [5000, 10], [10000, 20], [100000, 200]], w: 30, k: 90, p: ["instagram", "tiktok", "youtube_shorts"], r: false }) } }) === "signed", termsFingerprint(GETIMG_TERMS));
t("choosing a CPM makes it 'changed'", contractStatus({ ...GETIMG_TERMS, milestones: [], cpm: [{ from: 0, rate: 2 }], contract }) === "changed");
t("adding a cap makes the contract changed", contractStatus({ ...GETIMG_TERMS, milestones: [], cpm: [{ from: 0, rate: 2 }], cpmCap: 100000, contract: { ...contract, terms: termsFingerprint({ ...GETIMG_TERMS, milestones: [], cpm: [{ from: 0, rate: 2 }] }) } }) === "changed");
const html = contractWordHtml({ title: "A & B", sections: [{ heading: "1", lines: ["<x>"] }], signedLine: null });
t("the Word file escapes text", html.includes("A &amp; B") && html.includes("&lt;x&gt;") && html.includes("Draft: have a lawyer"));
console.log(bad ? `${bad} failed` : "all passed");
process.exit(bad ? 1 : 0);
