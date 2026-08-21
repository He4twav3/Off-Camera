import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type {
  PlatformEnum,
  PayoutTypeEnum,
  AccountRequirementEnum,
} from "@/lib/database.types";
import { JobCard } from "@/components/JobCard";
import { JobFilters } from "@/components/JobFilters";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Browse jobs",
  description: "Open paid content-creation campaigns for creators.",
};

interface SearchParams {
  platform?: string;
  niche?: string;
  payout_type?: string;
  account_requirement?: string;
  sort?: string;
  my_range?: string;
}

// URL params are user-controlled, so narrow them against the known enum values
// before they reach the query — an unrecognised value is ignored rather than
// passed through to Postgres.
const PLATFORMS: PlatformEnum[] = ["tiktok", "instagram", "youtube_shorts", "x"];
const PAYOUT_TYPES: PayoutTypeEnum[] = ["flat", "cpm", "retainer"];
const ACCOUNT_REQUIREMENTS: AccountRequirementEnum[] = [
  "new_ok",
  "established_required",
];

function asEnum<T extends string>(
  value: string | undefined,
  allowed: T[],
): T | undefined {
  return value && (allowed as string[]).includes(value)
    ? (value as T)
    : undefined;
}

export default async function JobsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pull the signed-in applicant's saved pay range so the "my range" filter
  // can be offered. Logged-out visitors just don't see that control.
  let payMin: number | null = null;
  let payMax: number | null = null;
  if (user) {
    const { data: applicant } = await supabase
      .from("applicants")
      .select("preferred_pay_min, preferred_pay_max")
      .eq("user_id", user.id)
      .maybeSingle();
    payMin = applicant?.preferred_pay_min ?? null;
    payMax = applicant?.preferred_pay_max ?? null;
  }
  const hasPayRange = payMin !== null || payMax !== null;
  const rangeFilterOn = hasPayRange && searchParams.my_range === "1";

  const { data: niches } = await supabase
    .from("niches")
    .select("id, slug, label")
    .eq("is_active", true)
    .order("label");

  // Genuine query against real `jobs` rows — every filter below, including the
  // pay range, is applied in Postgres. An empty result here means there really
  // are no matching open jobs.
  let query = supabase
    .from("jobs")
    .select("*, niches(label)")
    .eq("status", "open");

  const platform = asEnum(searchParams.platform, PLATFORMS);
  if (platform) {
    query = query.eq("platform", platform);
  }
  if (searchParams.niche) {
    const match = niches?.find((n) => n.slug === searchParams.niche);
    if (match) query = query.eq("niche_id", match.id);
  }
  const payoutType = asEnum(searchParams.payout_type, PAYOUT_TYPES);
  if (payoutType) {
    query = query.eq("payout_type", payoutType);
  }
  const accountRequirement = asEnum(
    searchParams.account_requirement,
    ACCOUNT_REQUIREMENTS,
  );
  if (accountRequirement) {
    query = query.eq("account_requirement", accountRequirement);
  }
  if (rangeFilterOn) {
    if (payMin !== null) query = query.gte("payout_amount", payMin);
    if (payMax !== null) query = query.lte("payout_amount", payMax);
  }

  switch (searchParams.sort) {
    case "payout_desc":
      query = query.order("payout_amount", { ascending: false });
      break;
    case "payout_asc":
      query = query.order("payout_amount", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: jobs, error } = await query;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Open campaigns
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Browse what&apos;s available right now. Brand names and full briefs
          are shared once you&apos;re assigned to a campaign.
        </p>
      </header>

      <Suspense fallback={<FiltersSkeleton />}>
        <JobFilters niches={niches ?? []} hasPayRange={hasPayRange} />
      </Suspense>

      <div className="mt-8">
        {error ? (
          <EmptyState
            title="We couldn't load jobs right now"
            body="Something went wrong on our end. Refresh the page, and if it keeps happening, get in touch."
          />
        ) : !jobs || jobs.length === 0 ? (
          rangeFilterOn ? (
            <EmptyState
              title="No jobs currently match your preferred range"
              body="Check back soon — we post new campaigns regularly. You can also untick the pay-range filter to see everything that's open."
            />
          ) : (
            <EmptyState
              title="No jobs match these filters"
              body="Try clearing a filter or two to see more of what's open."
            />
          )
        ) : (
          <>
            <p className="mb-5 text-sm font-semibold text-muted-foreground">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
            </p>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <JobCard
                    job={job}
                    // Logged-out visitors get pushed to sign-up when they click
                    // a job, rather than into a details page they can't act on.
                    href={
                      user ? `/dashboard/recruiting/jobs/${job.id}` : `/signup?next=/dashboard/recruiting/jobs/${job.id}`
                    }
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-border/70 py-12 text-center">
      <CardContent>
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </CardContent>
    </Card>
  );
}

function FiltersSkeleton() {
  return (
    <div className="h-48 animate-pulse rounded-lg border border-border bg-card" />
  );
}
