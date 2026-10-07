import { feeStatus, groupFees, invoiceText, totalsOf, type FeeRow } from "../src/lib/fees";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

let n = 0;
const row = (p: Partial<FeeRow>): FeeRow => ({
  id: `s${n++}`, brandId: "b1", brand: "Glow Labs", jobId: "j1", campaign: "Skincare launch", creator: "Maya", handle: "maya",
  amount: 200, fee: 30, issuedAt: "2026-10-01", dueAt: "2026-10-15", feeReceivedAt: null, ...p,
});

// a single fee
t("a fee not yet paid is outstanding", feeStatus(row({})) === "outstanding");
t("a fee marked received is received", feeStatus(row({ feeReceivedAt: "2026-10-05" })) === "received");
t("no fee set is called out, not counted as zero owed", feeStatus(row({ fee: 0 })) === "unset");

// totals add up exactly
const mixed = [row({ fee: 30 }), row({ fee: 0.1 }), row({ fee: 0.2, feeReceivedAt: "x" }), row({ fee: 0 })];
const tt = totalsOf(mixed);
t("total fees", tt.fee === 30.3, tt);
t("received", tt.received === 0.2, tt);
t("outstanding", tt.outstanding === 30.1, tt);
t("a creator with no fee is counted so it isn't forgotten", tt.unset === 1 && tt.creators === 4, tt);
t("0.1 + 0.2 stays exact", totalsOf([row({ fee: 0.1 }), row({ fee: 0.2 })]).fee === 0.3);
t("nothing at all", JSON.stringify(totalsOf([])) === JSON.stringify({ fee: 0, received: 0, outstanding: 0, unset: 0, creators: 0 }));

// grouping: brand, campaign, creator
const rows = [
  row({ creator: "Maya", fee: 30 }),
  row({ creator: "Ana", fee: 20 }),
  row({ jobId: "j2", campaign: "Snack taste test", creator: "Leo", fee: 15 }),
  row({ brandId: "b2", brand: "Pocket Pay", jobId: "j3", campaign: "App walkthrough", creator: "Sofia", fee: 90 }),
  row({ brandId: "b2", brand: "Pocket Pay", jobId: "j3", campaign: "App walkthrough", creator: "Tomas", fee: 10, feeReceivedAt: "x" }),
  row({ brandId: null, brand: null, jobId: "j4", campaign: "Orphan", creator: "Ines", fee: 5 }),
];
const g = groupFees(rows);
t("three brands, one of them 'No brand attached'", g.length === 3 && g.some((b) => b.brand === "No brand attached"), g.map((b) => b.brand));
t("the brand owing most is first", g[0].brand === "Pocket Pay" && g[0].totals.outstanding === 90, g[0].totals);
const glow = g.find((b) => b.brand === "Glow Labs")!;
t("a brand's campaigns are separate", glow.campaigns.length === 2);
t("a brand's total is its campaigns added up", glow.totals.fee === 65 && glow.totals.outstanding === 65, glow.totals);
t("a campaign lists each creator", glow.campaigns.find((c) => c.campaign === "Skincare launch")!.rows.map((r) => r.creator).join() === "Ana,Maya");
t("campaign total", glow.campaigns.find((c) => c.campaign === "Skincare launch")!.totals.fee === 50);
const pocket = g[0];
t("received fees leave the outstanding total", pocket.totals.fee === 100 && pocket.totals.received === 10 && pocket.totals.outstanding === 90, pocket.totals);

// the text to paste into an invoice
const text = invoiceText(pocket);
t("invoice names the brand", text.startsWith("Fees owed by Pocket Pay"));
t("invoice lists what is owed, per creator", text.includes("Sofia (@maya): $90"), text);
t("invoice leaves out fees already received", !text.includes("Tomas"), text);
t("invoice ends with the total due", text.trim().endsWith("Total due: $90"), text);
t("invoice shows cents when there are some", invoiceText(groupFees([row({ fee: 12.5 })])[0]).includes("$12.50"));

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
