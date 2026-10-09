// TEMPORARY. Never committed. Getimg on the admin Statements screen.
import { AdminShell } from "@/components/admin/admin-shell";
import { adminNavGroups } from "@/lib/admin-nav";
import { StatementsView, type StatementRowData } from "@/app/admin/statements/StatementsView";
import { GETIMG_TERMS, payFor, suggestedStatement } from "@/lib/post-terms";
import { getimgPosts } from "../_getimg";

export default async function Page(props: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await props.searchParams;
  const pay = payFor(GETIMG_TERMS, getimgPosts);
  const due = suggestedStatement(pay, 0);
  const counted = getimgPosts.filter((p) => p.state !== "rejected" && p.authorVerified);
  const row: StatementRowData = {
    id: "a1", status: "submitted", views: counted.reduce((n, p) => n + p.views, 0), proof_url: null, suggested: due,
    applicants: { name: "Maya Rivers", email: "maya@example.com", handle: "maya" },
    jobs: { title: "Getimg", brand_accounts: { company_name: "Getimg" } },
    direct_payments: null, state: null,
    perPost: { earned: pay.earned, payable: pay.payable, statemented: 0, nextCycle: 1, counted: pay.counted, posts: getimgPosts.map((p) => ({ ...p, authorVerified: p.authorVerified, windowEndsAt: p.windowEndsAt })) },
  };
  return (
    <AdminShell groups={adminNavGroups(true)} email="founder@example.com">
      <StatementsView rows={[row]} tab={tab ?? "ready"} />
    </AdminShell>
  );
}
