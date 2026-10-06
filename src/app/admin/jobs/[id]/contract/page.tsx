import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { describeTerms, parsePayoutTerms } from "@/lib/payout-terms";
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/commission";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Campaign contract · Admin",
  robots: { index: false, follow: false },
};

/**
 * Campaign terms sheet generated from the job's payout formula. A draft for
 * the brand and creators to sign: have a lawyer review the template wording
 * (see docs/legal-drafts) before using it with real money.
 */
export default async function ContractPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("title, description, platform, payout_terms, brand_account_id")
    .eq("id", id)
    .maybeSingle();
  if (!job) notFound();

  const terms = parsePayoutTerms(job.payout_terms);
  const { data: brandRow } = job.brand_account_id
    ? await supabase
        .from("brand_accounts")
        .select("company_name")
        .eq("id", job.brand_account_id)
        .maybeSingle()
    : { data: null };
  const brand = brandRow?.company_name;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 text-foreground">
      <p className="text-sm font-semibold text-muted-foreground">
        Draft: not legal advice, review before use
      </p>
      <h1 className="mt-2 font-heading text-3xl font-semibold">
        Campaign terms: {job.title}
      </h1>

      <section className="mt-8 space-y-2 text-[15px] leading-relaxed">
        <h2 className="font-heading text-xl font-semibold">Parties</h2>
        <p>Brand: {brand ?? "[brand name]"}</p>
        <p>Agency: {siteConfig.name}</p>
        <p>Creator: [creator name and handle]</p>
      </section>

      <section className="mt-8 space-y-2 text-[15px] leading-relaxed">
        <h2 className="font-heading text-xl font-semibold">Deliverables</h2>
        <p>
          {terms
            ? `${terms.videos} video${terms.videos > 1 ? "s" : ""}`
            : "[number of videos]"}{" "}
          on {job.platform}, following the campaign brief. Posts must carry the
          required paid-partnership disclosure.
        </p>
      </section>

      <section className="mt-8 space-y-2 text-[15px] leading-relaxed">
        <h2 className="font-heading text-xl font-semibold">Payment</h2>
        {terms ? (
          <ul className="list-disc space-y-1 pl-5">
            {describeTerms(terms).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p>No payout formula set for this campaign yet. Add one on the job.</p>
        )}
        <p>
          The brand pays the agreed amount to {siteConfig.name}, which pays the
          creator after deducting{" "}
          {PLATFORM_COMMISSION_PERCENT === null
            ? "[commission]"
            : `a ${PLATFORM_COMMISSION_PERCENT}% commission`}
          . Creators are paid only once the brand&apos;s payment has been
          received. View counts are taken from the platforms at the end of the
          measurement window.
        </p>
      </section>
    </div>
  );
}
