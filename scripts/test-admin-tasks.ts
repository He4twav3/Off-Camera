/** Tests the admin to-do per campaign (src/lib/admin-tasks.ts). Run:  npx tsx scripts/test-admin-tasks.ts */
import { campaignTasks } from "../src/lib/admin-tasks";
import type { ACampaign, ACreator, AStatement } from "../src/lib/admin-workspace";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

const st = (o: Partial<AStatement> = {}): AStatement => ({ id: "s", cycle: 1, amount: 100, ourFee: 0, feeReceived: false, issuedAt: "", dueAt: "", state: "awaiting_payment", brandMethod: null, brandReference: null, brandPaidAt: null, confirmedAt: null, ...o });
const cr = (o: Partial<ACreator> = {}): ACreator => ({ assignmentId: "a", applicantId: "p", campaignId: "c", campaignTitle: "C", name: "N", email: "e", handle: "h", payout: { raw: null, link: null, provider: null }, accounts: [], status: "active", posts: [], statements: [], views: 0, videos: 0, earned: 0, payable: 0, statemented: 0, paid: 0, ourFees: 0, feesReceived: 0, awaitingReview: 0, ...o });
const camp = (o: Partial<ACampaign> = {}): ACampaign => ({ id: "c", title: "C", status: "open", platform: "tiktok", createdAt: "", brandId: "b", brandName: "B", nicheLabel: null, terms: null, perPost: true, creators: [], views: 0, videos: 0, earned: 0, payable: 0, statemented: 0, paid: 0, ourFees: 0, feesOutstanding: 0, awaitingReview: 0, ...o });
const terms = (reviewer: "oncamera" | "brand") => ({ v: 2 as const, basePerPost: 20, cycleSize: 15, milestones: [], windowDays: 30, keepPublicDays: 90, platforms: ["tiktok" as const], repostsEarnBase: false, reviewer });

t("a quiet campaign has nothing to do", campaignTasks(camp()).length === 0);
t("no brand attached is a task on an open campaign", campaignTasks(camp({ brandId: null })).some((x) => x.kind === "brand"));
t("but not on a closed one", !campaignTasks(camp({ brandId: null, status: "closed" })).some((x) => x.kind === "brand"));
t("videos we review are a task", campaignTasks(camp({ terms: terms("oncamera"), awaitingReview: 3 })).find((x) => x.kind === "review")?.count === 3);
t("videos the brand reviews are not ours", !campaignTasks(camp({ terms: terms("brand"), awaitingReview: 3 })).some((x) => x.kind === "review"));
t("a per-video creator with money due and no statement is a statement to issue", campaignTasks(camp({ creators: [cr({ payable: 50, statemented: 0 })] })).some((x) => x.kind === "statement" && x.count === 1));
t("once the statement covers it, the task is gone", !campaignTasks(camp({ creators: [cr({ payable: 50, statemented: 50, statements: [st()] })] })).some((x) => x.kind === "statement"));
t("a creator with nothing due is not a task, even after sending a video", !campaignTasks(camp({ creators: [cr({ status: "submitted", payable: 0 })] })).some((x) => x.kind === "statement"));
t("an older campaign is ready once the post is in and no statement exists", campaignTasks(camp({ perPost: false, creators: [cr({ status: "submitted" })] })).some((x) => x.kind === "statement"));
t("overdue and disputed payments are chased", campaignTasks(camp({ creators: [cr({ statements: [st({ state: "overdue" }), st({ id: "t", state: "disputed" }), st({ id: "u", state: "confirmed" })] })] })).find((x) => x.kind === "chase")?.count === 2);
const withStatement = camp({ creators: [cr({ statements: [st({ id: "s1" }), st({ id: "s2", state: "confirmed" })] })] });
t("with no email sent, a payment needs both emails", campaignTasks(withStatement, new Set()).find((x) => x.kind === "email")?.count === 2);
t("sending the brand email leaves one", campaignTasks(withStatement, new Set(["emailed_brand:s1"])).find((x) => x.kind === "email")?.count === 1);
t("once both are sent the task is gone", !campaignTasks(withStatement, new Set(["emailed_brand:s1", "emailed_creator:s1"])).some((x) => x.kind === "email"));
t("a payment the creator already confirmed needs no email", campaignTasks(camp({ creators: [cr({ statements: [st({ id: "s2", state: "confirmed" })] })] }), new Set()).length === 0);
t("without the sent list the email task is skipped", !campaignTasks(withStatement).some((x) => x.kind === "email"));
t("every task says where to do it", campaignTasks(camp({ brandId: null, terms: terms("oncamera"), awaitingReview: 1, creators: [cr({ payable: 5, statements: [st({ state: "overdue" })] })] }), new Set()).every((x) => x.href.startsWith("/admin")));

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
