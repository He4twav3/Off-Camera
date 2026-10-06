/**
 * Tests the rules for when earnings may be released to a balance automatically
 * (src/lib/auto-release.ts). Run:  npx tsx scripts/test-auto-release.ts
 */
import { planRelease, type ReleaseInput } from "../src/lib/auto-release";
import { payoutTermsSchema } from "../src/lib/payout-terms";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const DAY = 86400000;
const now = new Date("2026-11-30T12:00:00Z");
const terms = (o: object) =>
  payoutTermsSchema.parse({ v: 1, videos: 1, fixedPerVideo: 0, cpm: null, bonuses: [], capPerCreator: null, measureDays: 30, fixedPaidOn: "approval", ...o });
const base = (o: Partial<ReleaseInput>): ReleaseInput => ({
  status: "submitted", terms: null, legacyAmount: 500, views: 0,
  viewsUpdatedAt: new Date(now.getTime() - DAY), submittedAt: new Date(now.getTime() - 40 * DAY),
  approvedAt: new Date(now.getTime() - 39 * DAY), brandPaid: true, grossFunded: 500, released: 0,
  stagesDone: [], commissionPercent: null, now, ...o,
});
const kind = (o: Partial<ReleaseInput>) => planRelease(base(o)).kind;
const rel = (o: Partial<ReleaseInput>) => { const p = planRelease(base(o)); return p.kind === "release" ? p : null; };

t("active: waits", kind({ status: "active" }) === "wait");
t("paid: waits (nothing to do)", kind({ status: "paid" }) === "wait");
t("disputed: needs attention, never released", kind({ status: "disputed" }) === "attention");
t("not approved: needs attention", kind({ approvedAt: null }) === "attention");
t("brand hasn't paid: needs attention", kind({ brandPaid: false }) === "attention");
t("already fully released: waits", kind({ stagesDone: ["full"] }) === "wait" && kind({ stagesDone: ["fixed", "rest"] }) === "wait");

t("no formula: released in full at approval", rel({})?.amount === 500 && rel({})?.stage === "full" && rel({})?.final === true);
t("no formula: zero amount needs attention", kind({ legacyAmount: 0 }) === "attention");
t("no formula: more than the brand paid needs attention", kind({ legacyAmount: 600, grossFunded: 500 }) === "attention");

const fx = terms({ fixedPerVideo: 300, videos: 2 });
t("fixed only: 2 x $300 released at approval", rel({ terms: fx, grossFunded: 600 })?.amount === 600);
t("fixed only: window irrelevant", rel({ terms: fx, grossFunded: 600, submittedAt: now })?.amount === 600);
t("fixed only: capped by the max", rel({ terms: terms({ fixedPerVideo: 300, videos: 2, capPerCreator: 450 }), grossFunded: 600 })?.amount === 450);

const cpm = terms({ cpm: { ratePer1000: 5, startsAt: 0 } });
const fresh = new Date(now.getTime() - 5 * DAY);
t("cpm only: waits while the window is open", kind({ terms: cpm, submittedAt: fresh, views: 50000 }) === "wait");
t("cpm only: says when", (planRelease(base({ terms: cpm, submittedAt: fresh })) as { until?: Date }).until?.getTime() === fresh.getTime() + 30 * DAY);
t("cpm only: released at the end of the window", rel({ terms: cpm, views: 50000, grossFunded: 300 })?.amount === 250);
t("cpm only: exact boundary is eligible", rel({ terms: cpm, views: 10000, grossFunded: 300, submittedAt: new Date(now.getTime() - 30 * DAY) })?.amount === 50);
t("cpm only: one second early waits", kind({ terms: cpm, views: 10000, grossFunded: 300, submittedAt: new Date(now.getTime() - 30 * DAY + 1000) }) === "wait");
t("cpm only: stale view counts need attention", kind({ terms: cpm, views: 50000, grossFunded: 300, viewsUpdatedAt: new Date(now.getTime() - 5 * DAY) }) === "attention");
t("cpm only: never-counted views need attention", kind({ terms: cpm, views: 50000, grossFunded: 300, viewsUpdatedAt: null }) === "attention");
t("cpm only: zero views needs attention", kind({ terms: cpm, views: 0, grossFunded: 300 }) === "attention");
t("cpm only: more than funded needs attention", kind({ terms: cpm, views: 200000, grossFunded: 300 }) === "attention");
t("cpm only: capped at the max", rel({ terms: terms({ cpm: { ratePer1000: 5, startsAt: 0 }, capPerCreator: 200 }), views: 200000, grossFunded: 300 })?.amount === 200);
t("cpm only: missing submit time needs attention", kind({ terms: cpm, views: 50000, submittedAt: null }) === "attention");

const two = terms({ fixedPerVideo: 100, cpm: { ratePer1000: 5, startsAt: 0 }, fixedPaidOn: "approval" });
const s1 = rel({ terms: two, grossFunded: 500, submittedAt: fresh });
t("two-stage: fixed fee released at approval", s1?.stage === "fixed" && s1.amount === 100 && s1.final === false);
t("two-stage: then waits for the window", kind({ terms: two, grossFunded: 500, submittedAt: fresh, stagesDone: ["fixed"], released: 100 }) === "wait");
const s2 = rel({ terms: two, grossFunded: 500, views: 60000, stagesDone: ["fixed"], released: 100 });
t("two-stage: the rest is total minus what was already paid", s2?.stage === "rest" && s2.amount === 300 && s2.final === true, s2);
t("two-stage: can't exceed the brand's payment", kind({ terms: two, grossFunded: 350, views: 60000, stagesDone: ["fixed"], released: 100 }) === "attention");

const end = terms({ fixedPerVideo: 100, cpm: { ratePer1000: 5, startsAt: 0 }, fixedPaidOn: "end" });
t("fixed paid at end: nothing at approval", kind({ terms: end, submittedAt: fresh }) === "wait");
t("fixed paid at end: one release of everything", rel({ terms: end, views: 60000, grossFunded: 500 })?.amount === 400 && rel({ terms: end, views: 60000, grossFunded: 500 })?.stage === "full");

const bonus = terms({ fixedPerVideo: 100, bonuses: [{ views: 100000, amount: 200 }], fixedPaidOn: "end" });
t("bonus-only performance waits for the window", kind({ terms: bonus, submittedAt: fresh }) === "wait");
t("bonus reached is included", rel({ terms: bonus, views: 150000, grossFunded: 500 })?.amount === 300);
t("bonus not reached is not", rel({ terms: bonus, views: 50000, grossFunded: 500 })?.amount === 100);

t("15% commission on a fixed fee", rel({ terms: terms({ fixedPerVideo: 200 }), grossFunded: 200, commissionPercent: 15 })?.amount === 170);
const c = rel({ terms: two, grossFunded: 500, views: 60000, stagesDone: ["fixed"], released: 85, commissionPercent: 15 });
t("15% commission on the final stage: (400 x 0.85) - 85 = 255", c?.amount === 255 && c.stage === "rest", c);
t("amounts are rounded to cents", rel({ terms: terms({ cpm: { ratePer1000: 0.07, startsAt: 0 } }), views: 12345, grossFunded: 5 })?.amount === 0.86);

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
