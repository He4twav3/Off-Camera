// TEMPORARY. Never committed.
import { CreatorShell } from "../_shell";
import { DirectPayments } from "@/app/dashboard/recruiting/earnings/DirectPayments";
import { iso } from "../_data";
import { getimgJob, getimgPosts } from "../_getimg";
import { GETIMG_TERMS } from "@/lib/post-terms";
import { myCampaignRow, sortMyCampaigns } from "@/lib/my-campaigns";

const s = (o: Record<string, unknown>) => ({
  id: crypto.randomUUID(), amount: 100, issued_at: iso(-9), due_at: iso(5), brand_paid_at: null, brand_method: null, brand_reference: null,
  creator_confirmed_at: null, creator_disputed_at: null, creator_dispute_note: null, campaign: "Unbox and test a portable blender", brand: "Home Co", ...o,
});

export default async function Page(props: { searchParams: Promise<{ filled?: string }> }) {
  const { filled } = await props.searchParams;
  const campaigns = filled
    ? sortMyCampaigns([
        myCampaignRow({ assignmentId: "a1", status: "submitted", expectedAmount: 0, job: { id: "j-getimg", title: "Getimg", logo_url: (getimgJob as { logo_url: string }).logo_url, platform: "tiktok", post_terms: GETIMG_TERMS }, posts: getimgPosts, paidTotal: 99 }),
        myCampaignRow({ assignmentId: "a2", status: "submitted", expectedAmount: 82, job: { id: "j-blend", title: "Unbox and test a portable blender", logo_url: null, platform: "instagram", post_terms: null }, posts: [], paidTotal: 0 }),
      ])
    : [];
  return (
    <CreatorShell pathname="/dashboard/recruiting/earnings">
      <DirectPayments
        campaigns={campaigns}
        campaignHref={(r) => (r.jobId === "j-getimg" ? "/preview/getimg" : "/preview/campaign")}
        campaignsPath="/preview/campaigns"
        accountPath="/preview/payments"
        payoutInstructions={filled ? "PayPal: maya@example.com" : null}
        statements={!filled ? [] : [
          s({ amount: 82, brand_paid_at: iso(-1), brand_method: "PayPal" }),
          s({ amount: 60, campaign: "Budgeting app week", brand: "Pocket Pay" }),
          s({ amount: 99, campaign: "Morning skincare routine", brand: "Glow Labs", brand_paid_at: iso(-8), brand_method: "Bank transfer", creator_confirmed_at: iso(-6) }),
        ] as never}
      />
    </CreatorShell>
  );
}
