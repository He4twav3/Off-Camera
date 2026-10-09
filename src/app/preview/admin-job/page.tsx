// TEMPORARY. Never committed. The real Admin → Jobs edit form with a mock Getimg job.
import { JobForm } from "@/app/admin/jobs/JobForm";
import type { Job } from "@/lib/database.types";

const job = {
  id: "j1", title: "Getimg", description: "Make clear, product-led content\nPost on Instagram, TikTok or YouTube", platform: "tiktok", niche_id: "n1",
  payout_type: "flat", payout_amount: 20, payout_notes: "Pays per video, with view bonuses.", account_requirement: "new_ok", status: "open",
  notion_sop_url: null, brand_account_id: null, payout_terms: null, post_terms: null, logo_url: null, about: "Getimg is an all-in-one creative AI workspace.",
  formats: "Speed challenge\nTalking head", example_urls: [], sample_required: false, sample_criteria: null, affiliate_url: null, created_at: new Date().toISOString(),
} as unknown as Job;

export default function Page() {
  return (
    <div className="app-ui mx-auto max-w-4xl p-6">
      <h1 className="mb-1 font-heading text-2xl font-semibold">Admin · Jobs (mock)</h1>
      <p className="mb-6 text-sm text-muted-foreground">Open Getimg with Edit, then set the Brand to attach it to their account.</p>
      <JobForm niches={[{ id: "n1", label: "Tech" }, { id: "n2", label: "Beauty" }]} brands={[{ id: "b1", company_name: "Getimg" }, { id: "b2", company_name: "Another Brand Ltd" }]} job={job} />
    </div>
  );
}
