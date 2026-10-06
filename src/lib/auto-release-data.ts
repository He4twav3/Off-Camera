import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { parsePayoutTerms } from "@/lib/payout-terms";
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/commission";
import type { ReleaseInput } from "@/lib/auto-release";

type Db = SupabaseClient<Database>;

export type ReleaseCandidate = {
  assignmentId: string;
  applicantId: string;
  jobTitle: string;
  applicant: { name: string; email: string } | null;
  input: ReleaseInput;
};

const clean = (h: string) => h.trim().replace(/^@+/, "").toLowerCase();

/**
 * Gathers everything planRelease() needs for submitted assignments: the
 * formula, the brand's payment, what's already been credited, and the counted
 * views of the creator's post. Works with the service-role client (the daily job)
 * or an admin's own client (the Payouts page), whose policies allow the same reads.
 */
export async function loadReleaseCandidates(db: Db, only?: string[]): Promise<ReleaseCandidate[]> {
  let q = db
    .from("assignments")
    .select(
      "id, status, applicant_id, applicant_payout_amount, submitted_at, approved_at, jobs(id, title, platform, payout_terms), payouts(gross_amount, brand_paid_at), applicants(name, email, handle)",
    )
    .eq("status", "submitted");
  if (only) q = q.in("id", only);
  const { data: rows } = await q;
  const list = rows ?? [];
  if (list.length === 0) return [];

  const ids = list.map((r) => r.id);
  const applicantIds = [...new Set(list.map((r) => r.applicant_id))];
  const titles = [...new Set(list.map((r) => r.jobs?.title).filter((t): t is string => Boolean(t)))];

  const [{ data: ledger }, { data: handles }, { data: views }] = await Promise.all([
    db.from("balance_entries").select("assignment_id, amount, stage").eq("kind", "earning").in("assignment_id", ids),
    db.from("applicant_handles").select("applicant_id, platform, handle").in("applicant_id", applicantIds),
    db.from("campaign_views").select("campaign, platform, handle, views, updated_at").in("campaign", titles),
  ]);

  return list.map((r) => {
    const entries = (ledger ?? []).filter((e) => e.assignment_id === r.id);
    const platform = r.jobs?.platform;
    const own = new Set([
      ...(handles ?? []).filter((h) => h.applicant_id === r.applicant_id && h.platform === platform).map((h) => clean(h.handle)),
      ...(r.applicants?.handle ? [clean(r.applicants.handle)] : []),
    ]);
    const mine = (views ?? []).filter((v) => v.campaign === r.jobs?.title && v.platform === platform && own.has(clean(v.handle)));
    const updated = mine.map((v) => new Date(v.updated_at).getTime());
    return {
      assignmentId: r.id,
      applicantId: r.applicant_id,
      jobTitle: r.jobs?.title ?? "your campaign",
      applicant: r.applicants ? { name: r.applicants.name, email: r.applicants.email } : null,
      input: {
        status: r.status,
        terms: parsePayoutTerms(r.jobs?.payout_terms),
        legacyAmount: Number(r.applicant_payout_amount),
        views: mine.reduce((n, v) => n + Number(v.views), 0),
        viewsUpdatedAt: updated.length ? new Date(Math.max(...updated)) : null,
        submittedAt: r.submitted_at ? new Date(r.submitted_at) : null,
        approvedAt: r.approved_at ? new Date(r.approved_at) : null,
        brandPaid: Boolean(r.payouts?.brand_paid_at),
        grossFunded: Number(r.payouts?.gross_amount ?? 0),
        released: entries.reduce((n, e) => n + Number(e.amount), 0),
        stagesDone: entries.map((e) => e.stage),
        commissionPercent: PLATFORM_COMMISSION_PERCENT,
        now: new Date(),
      } satisfies ReleaseInput,
    };
  });
}
