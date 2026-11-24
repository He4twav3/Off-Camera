/** Tests the hand-topped-up tool credits (src/lib/tool-credits.ts). Run:  npx tsx scripts/test-tool-credits.ts */
import {
  GETIMG_CREDITS,
  creditProgramByKey,
  creditProgramFor,
  creditsCsv,
  markSent,
  normalizeEmail,
  unmarkSent,
  upsertRequest,
  waiting,
  type CreditRequest,
} from "../src/lib/tool-credits";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

// Which campaigns carry it
t("the Getimg campaign has credits", creditProgramFor({ title: "Getimg UGC", about: null })?.key === "getimg");
t("another campaign doesn't", creditProgramFor({ title: "MePersona creators", about: null }) === null);
t("found by key", creditProgramByKey("getimg") === GETIMG_CREDITS && creditProgramByKey("nope") === null);

// Emails
t("an email is trimmed and lowercased", normalizeEmail("  Sam@Example.COM ") === "sam@example.com");
t("not an email is refused", normalizeEmail("sam@") === null && normalizeEmail("sam example.com") === null && normalizeEmail("") === null);

// The list
const base = { name: "Sam", email: "sam@oncamera.test", submittedAt: "2026-11-24T10:00:00.000Z" };
let list: CreditRequest[] = upsertRequest([], { applicantId: "a1", toolEmail: "sam@x.test", ...base });
list = upsertRequest(list, { applicantId: "a2", toolEmail: "kim@x.test", ...base, name: "Kim", submittedAt: "2026-11-24T09:00:00.000Z" });
t("two creators waiting, oldest first", waiting(list).map((r) => r.applicantId).join() === "a2,a1", waiting(list));

const same = upsertRequest(list, { applicantId: "a1", toolEmail: "sam@x.test", ...base, submittedAt: "2026-11-25T00:00:00.000Z" });
t("the same email again changes nothing", same === list);

const sent = markSent(list, ["a1"], "2026-11-25T12:00:00.000Z");
t("marking sent marks only those listed", sent.marked === 1 && waiting(sent.list).map((r) => r.applicantId).join() === "a2", sent);
const again = markSent(sent.list, ["a1"], "2026-12-01T00:00:00.000Z");
t("an already-sent date is kept", again.marked === 0 && again.list.find((r) => r.applicantId === "a1")?.sentAt === "2026-11-25T12:00:00.000Z");

const changed = upsertRequest(sent.list, { applicantId: "a1", toolEmail: "sam2@x.test", ...base });
t("a new email goes back on the waiting list", changed.find((r) => r.applicantId === "a1")?.sentAt === undefined && changed.length === 2, changed);

const undone = unmarkSent(sent.list, "a1");
t("'not sent' puts it back on the list", waiting(undone).length === 2);

// The list for the brand
const csv = creditsCsv(GETIMG_CREDITS, waiting(list));
const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
t("the CSV starts with the account email", lines[0] === "getimg.ai account email,creator name,added on", lines[0]);
t("one row per creator", lines.length === 3 && lines[1] === "kim@x.test,Kim,2026-11-24", lines);
t("a name with a comma is quoted", creditsCsv(GETIMG_CREDITS, [{ ...list[0], name: "Lee, Jr" }]).includes('"Lee, Jr"'));

if (bad) {
  console.log(`\n${bad} failed`);
  process.exit(1);
}
console.log("\nall passed");
