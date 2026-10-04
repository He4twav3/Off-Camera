import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformEnum } from "@/lib/database.types";

/**
 * What a brand is allowed to see about its own campaigns: creator name and
 * handle, where they are on the campaign, the link to their post, and views.
 * Deliberately NOT creator emails, payouts or anything else on `applicants` /
 * `assignments` — this reads with the service role, so it selects columns
 * explicitly and only ever for jobs whose brand_account_id is the caller's.
 * Callers must pass a brand id they have already tied to the signed-in user.
 */

export type BrandCreator = {
  assignmentId: string;
  name: string;
  handle: string;
  platform: PlatformEnum;
  status: "active" | "submitted" | "paid" | "disputed";
  proofUrl: string | null;
  views: number;
};

export type BrandCampaign = {
  id: string;
  title: string;
  platform: PlatformEnum;
  status: "open" | "filled" | "closed";
  createdAt: string;
  creators: BrandCreator[];
  totalViews: number;
};

export async function getBrandCampaigns(brandId: string): Promise<BrandCampaign[]> {
  const db = createAdminClient();

  const { data: jobs } = await db
    .from("jobs")
    .select("id, title, platform, status, created_at")
    .eq("brand_account_id", brandId)
    .order("created_at", { ascending: false });
  if (!jobs || jobs.length === 0) return [];

  const jobIds = jobs.map((j) => j.id);
  const { data: assignments } = await db
    .from("assignments")
    .select("id, job_id, applicant_id, status, proof_url")
    .in("job_id", jobIds);

  const applicantIds = [...new Set((assignments ?? []).map((a) => a.applicant_id))];
  const [{ data: applicants }, { data: handles }, { data: views }] = await Promise.all([
    applicantIds.length
      ? db.from("applicants").select("id, name, handle, platform").in("id", applicantIds)
      : Promise.resolve({ data: [] }),
    applicantIds.length
      ? db.from("applicant_handles").select("applicant_id, handle").in("applicant_id", applicantIds)
      : Promise.resolve({ data: [] }),
    db
      .from("campaign_views")
      .select("campaign, handle, views")
      .in("campaign", jobs.map((j) => j.title)),
  ]);

  const applicantById = new Map((applicants ?? []).map((a) => [a.id, a]));
  const handlesByApplicant = new Map<string, string[]>();
  for (const h of handles ?? []) {
    const list = handlesByApplicant.get(h.applicant_id) ?? [];
    list.push(h.handle.toLowerCase());
    handlesByApplicant.set(h.applicant_id, list);
  }

  return jobs.map((job) => {
    const creators: BrandCreator[] = (assignments ?? [])
      .filter((a) => a.job_id === job.id)
      .map((a) => {
        const person = applicantById.get(a.applicant_id);
        const own = new Set([
          ...(handlesByApplicant.get(a.applicant_id) ?? []),
          (person?.handle ?? "").toLowerCase(),
        ]);
        const creatorViews = (views ?? [])
          .filter((v) => v.campaign === job.title && own.has(v.handle))
          .reduce((n, v) => n + v.views, 0);
        return {
          assignmentId: a.id,
          name: person?.name ?? "Creator",
          handle: person?.handle ?? "",
          platform: (person?.platform ?? job.platform) as PlatformEnum,
          status: a.status,
          proofUrl: a.proof_url,
          views: creatorViews,
        };
      });
    return {
      id: job.id,
      title: job.title,
      platform: job.platform,
      status: job.status,
      createdAt: job.created_at,
      creators,
      totalViews: creators.reduce((n, c) => n + c.views, 0),
    };
  });
}
