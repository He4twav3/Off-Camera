import { myCampaignRow, sortMyCampaigns } from "../src/lib/my-campaigns";
import { GETIMG_TERMS } from "../src/lib/post-terms";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

const now = new Date("2026-09-30T12:00:00Z");
let n = 0;
const post = (views: number, state: "counting" | "final" = "counting") => {
  n++;
  return { id: `p${String(n).padStart(3, "0")}`, state, authorVerified: true, views, submittedAt: new Date(Date.UTC(2026, 8, 1, 0, n)).toISOString(), windowEndsAt: new Date(Date.UTC(2026, 9, 25)).toISOString() };
};
const job = { id: "j1", title: "Getimg", logo_url: "https://x/logo.png", platform: "tiktok", post_terms: GETIMG_TERMS };

// a campaign paid per post
const posts = [...Array.from({ length: 15 }, () => post(2000, "final")), ...Array.from({ length: 7 }, () => post(500))];
const r = myCampaignRow({ assignmentId: "a1", status: "submitted", expectedAmount: 0, job, posts, paidTotal: 100 }, now);
t("a tracked campaign is marked as one", r.kind === "post");
t("total earned: 22 posts at $20, plus $2 on each of the 15 posts at 2,000 views", r.amount === 22 * 20 + 15 * 2, r);
t("the bar splits paid, due and still counting", r.bar!.paid === 100 && r.bar!.due === 230 && r.bar!.counting === 140 && r.bar!.total === 470, r.bar);
t("posts and where you are in the cycle", r.posts === 22 && r.inCycle === 7 && r.cycleSize === 15, r);
t("views are added up over counted posts", r.views === 15 * 2000 + 7 * 500, r);
t("the logo and title come through", r.logoUrl === "https://x/logo.png" && r.title === "Getimg");

// a campaign with no posts yet
const empty = myCampaignRow({ assignmentId: "a2", status: "active", expectedAmount: 0, job, posts: [], paidTotal: 0 }, now);
t("a new campaign starts at zero", empty.amount === 0 && empty.posts === 0 && empty.inCycle === 0 && empty.bar!.total === 0, empty);

// rejected and unconfirmed posts don't count
const odd = myCampaignRow({ assignmentId: "a3", status: "active", expectedAmount: 0, job, posts: [post(9999), { ...post(9999), state: "counting" as const, authorVerified: false }, { ...post(9999), state: "final" as const, authorVerified: true }].map((p, i) => (i === 0 ? { ...p, state: "counting" as const } : p)), paidTotal: 0 }, now);
t("an unconfirmed post doesn't count toward posts or views", odd.posts === 2 && odd.views === 2 * 9999, odd);

// any other campaign
const basic = myCampaignRow({ assignmentId: "a4", status: "submitted", expectedAmount: 80, job: { ...job, id: "j2", title: "Skincare", post_terms: null }, posts: [], paidTotal: 0 }, now);
t("another kind of campaign shows its status and expected pay", basic.kind === "basic" && basic.amount === 80 && basic.statusLabel === "In review" && basic.bar === null, basic);
t("a paid one says paid", myCampaignRow({ assignmentId: "a5", status: "paid", expectedAmount: 80, job: { ...job, post_terms: null }, posts: [], paidTotal: 0 }, now).statusLabel === "Paid");

// order
const rows = sortMyCampaigns([basic, empty, r]);
t("the campaign with the most due comes first", rows[0].assignmentId === "a1", rows.map((x) => x.assignmentId));

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
