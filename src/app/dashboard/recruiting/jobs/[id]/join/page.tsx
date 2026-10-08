import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/kit/ui";
import { PayStrip } from "@/components/app/PayStrip";
import { parsePayoutTerms } from "@/lib/payout-terms";
import {
  describePostTerms,
  parsePostTerms,
  postTermsChips,
} from "@/lib/post-terms";
import { formatPayoutSummary } from "@/lib/utils";
import { JoinSteps } from "../JoinSteps";

export const metadata: Metadata = { title: "Apply to campaign" };

export default async function JoinPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const campaignPath = `/dashboard/recruiting/jobs/${id}`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/signup?next=${campaignPath}/join`);

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, title, status, description, sample_required, payout_type, payout_amount, payout_terms, post_terms",
    )
    .eq("id", id)
    .maybeSingle();
  if (!job) notFound();

  const { data: applicant } = await supabase
    .from("applicants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!applicant) redirect("/dashboard/recruiting/profile-setup");

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("applicant_id", applicant.id)
    .eq("job_id", job.id)
    .maybeSingle();

  // One connected account is needed first: that's where your views are counted.
  const { count: verified } = await supabase
    .from("applicant_handles")
    .select("id", { count: "exact", head: true })
    .eq("applicant_id", applicant.id)
    .not("verified_at", "is", null);
  if (!verified) redirect("/dashboard/account/accounts");

  // Nothing to join: already on it, closed, or it asks for a sample (applies instead).
  if (assignment || job.status !== "open" || job.sample_required)
    redirect(campaignPath);

  const terms = parsePayoutTerms(job.payout_terms);
  const postTerms = parsePostTerms(job.post_terms);

  return (
    <PageShell>
      <div className="mx-auto max-w-xl">
        <Link
          href={campaignPath}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {job.title}
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          Join {job.title}
        </h1>
        <div className="mt-3">
          {postTerms ? (
            <ul
              className="flex flex-wrap gap-2"
              aria-label="How this campaign pays"
            >
              {postTermsChips(postTerms).map((c, i) => (
                <li
                  key={c}
                  className={`rounded-md border px-3 py-1 text-sm font-semibold ${i === 0 ? "border-primary/30 bg-primary/10 text-primary" : "border-border/70 bg-muted/50 text-foreground"}`}
                >
                  {c}
                </li>
              ))}
            </ul>
          ) : terms ? (
            <PayStrip terms={terms} />
          ) : (
            <p className="font-heading text-lg font-semibold text-primary">
              {formatPayoutSummary(job.payout_type, job.payout_amount)}
            </p>
          )}
        </div>
        <div className="mt-8">
          <JoinSteps
            jobId={job.id}
            title={job.title}
            brief={job.description}
            payLines={postTerms ? describePostTerms(postTerms) : []}
            campaignPath={campaignPath}
          />
        </div>
      </div>
    </PageShell>
  );
}
