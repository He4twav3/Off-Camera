/** Tests the brand affiliate programs and their partner codes (src/lib/affiliate-programs.ts). Run:  npx tsx scripts/test-affiliates.ts */
import {
  MEPERSONA_PARTNERS,
  heldBy,
  mergeCodes,
  nextFree,
  normalizeLink,
  parseCodesCsv,
  programFor,
  reportCsv,
  type AffiliateCode,
} from "../src/lib/affiliate-programs";
import { MEPERSONA } from "../src/lib/campaign-presets";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

// A file shaped like the brand's (byte-order mark, quoted cells). Made-up codes: the real ones are private.
const file =
  '﻿"number","code","status","creator name","email","link","used on"\r\n' +
  '"1","XX-001-TEST","unused","","","",""\r\n' +
  '"2","XX-002-TEST","unused","","","",""\r\n' +
  '"3","XX-003-TEST","unused","","","",""\r\n';
const parsed = parseCodesCsv(file);
t("the brand's code file is read", parsed.ok && parsed.codes.length === 3, parsed);
const codes = parsed.ok ? parsed.codes : [];
t("codes start unused, numbered", codes[0]?.number === 1 && codes[0]?.code === "XX-001-TEST" && codes[0]?.status === "unused", codes[0]);
t("a file without a code column is refused", !parseCodesCsv("number,name\n1,x\n").ok);
t("an empty file is refused", !parseCodesCsv('"number","code"\n').ok);

// Giving codes out
t("the next free code is the lowest number", nextFree(codes)?.code === "XX-001-TEST");
const given: AffiliateCode[] = codes.map((c) => (c.number === 1 ? { ...c, status: "given", applicantId: "a1", name: "Sam" } : c));
t("a creator keeps the code they were given", heldBy(given, "a1")?.code === "XX-001-TEST");
t("the next creator gets the next number", nextFree(given)?.code === "XX-002-TEST");
const retired: AffiliateCode[] = given.map((c) => (c.number === 1 ? { ...c, status: "retired" } : c));
t("a retired code isn't held any more", heldBy(retired, "a1") === null);
t("a retired code is never given again", nextFree(retired)?.code === "XX-002-TEST");
t("no codes left gives none", nextFree(codes.map((c) => ({ ...c, status: "given" as const }))) === null);

// Uploading the list again never touches codes already given
const again = mergeCodes(given, codes);
t("re-uploading adds nothing", again.added === 0 && again.codes.length === 3);
t("re-uploading keeps who has which code", heldBy(again.codes, "a1")?.code === "XX-001-TEST");
const more = mergeCodes(given, [{ number: 4, code: "XX-004-TEST", status: "unused" }]);
t("new codes are added", more.added === 1 && more.codes.length === 4);

// Personal links
t("a link without https is completed", normalizeLink(MEPERSONA_PARTNERS, "mepersona.ai/go/sam") === "https://mepersona.ai/go/sam");
t("www and a trailing slash are fine", normalizeLink(MEPERSONA_PARTNERS, "https://www.mepersona.ai/go/sam_23/") === "https://mepersona.ai/go/sam_23");
t("another site is refused", normalizeLink(MEPERSONA_PARTNERS, "https://evil.example/go/sam") === null);
t("the partner signup page isn't a personal link", normalizeLink(MEPERSONA_PARTNERS, "mepersona.ai/partners/oncamera") === null);

// Which campaigns carry it
t("the MePersona campaign has the program", programFor({ title: "MePersona", about: null })?.key === "mepersona");
t("another campaign doesn't", programFor({ title: "Getimg", about: "AI studio" }) === null);
t("it matches exactly the campaigns the setup does", MEPERSONA_PARTNERS.matches === MEPERSONA.matches);

// The report for the brand
const report = reportCsv([{ ...given[0], email: "sam@x.com", link: "https://mepersona.ai/go/sam", givenAt: "2026-11-02T10:00:00Z", posts: 3, views: 12500 }]);
t("the report lists code number, code, creator, link and results", report.includes("1,XX-001-TEST,given,Sam,sam@x.com,https://mepersona.ai/go/sam,2026-11-02,3,12500"), report);

// The scripts end on the partner link
t("every script ends on the partner link", (MEPERSONA.scripts.match(/Use my link in bio for 20% off your first 3 months/g) ?? []).length === 5);
t("no script still sends viewers to the free plan link", !/Free to start, link in bio|About 300 replies a month free\.|Link in bio\."/.test(MEPERSONA.scripts));

console.log(bad ? `\n${bad} failed` : "\nAll passed");
process.exit(bad ? 1 : 0);
