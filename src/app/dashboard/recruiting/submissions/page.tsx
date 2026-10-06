import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, assignmentStatusTone } from "@/components/ui/status-badge";
import { PayStrip } from "@/components/app/PayStrip";
import { calculatePayout, parsePayoutTerms } from "@/lib/payout-terms";
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/commission";
import { formatCurrency, formatDate, PLATFORM_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Submissions" };

// Add in cents so amounts like 0.1 + 0.2 stay exact.
const sumMoney = (values: number[]) => values.reduce((c, v) => c + Math.round(v * 100), 0) / 100;

const STATUS_LABEL: Record<string, string> = {
  active: "In progress",
  submitted: "In review",
  paid: "Paid",
  disputed: "Being looked at",
};

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/recruiting/submissions");

  const { data: applicant } = await supabase
    .from("applicants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!applicant) redirect("/dashboard/recruiting/profile-setup");

  // Assignments join to jobs, never to payouts: what a brand paid us is admin-only.
  const [{ data: assignments }, { data: viewRows }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, status, proof_url, applicant_payout_amount, assigned_at, paid_at, jobs(id, title, platform, payout_terms)")
      .eq("applicant_id", applicant.id)
      .order("assigned_at", { ascending: false }),
    // RLS limits this to views on the creator's own handles.
    supabase.from("campaign_views").select("campaign, views"),
  ]);

  const viewsByCampaign = new Map<string, number>();
  for (const v of viewRows ?? []) {
    viewsByCampaign.set(v.campaign, (viewsByCampaign.get(v.campaign) ?? 0) + Number(v.views));
  }

  const rows = (assignments ?? []).map((a) => {
    const terms = parsePayoutTerms(a.jobs?.payout_terms);
    const views = a.jobs ? (viewsByCampaign.get(a.jobs.title) ?? 0) : 0;
    // What the formula gives at today's views, less our commission if one is set.
    // Once paid, the amount actually paid replaces the estimate.
    const formula = terms ? calculatePayout(terms, views).total : null;
    const estimate =
      formula === null
        ? Number(a.applicant_payout_amount)
        : Math.round(formula * (1 - (PLATFORM_COMMISSION_PERCENT ?? 0) / 100) * 100) / 100;
    const amount = a.status === "paid" ? Number(a.applicant_payout_amount) : estimate;
    return { a, terms, views, amount, estimated: a.status !== "paid" && formula !== null };
  });

  const submitted = rows.filter((r) => r.a.proof_url).length;
  const totalViews = rows.reduce((n, r) => n + r.views, 0);
  const pending = sumMoney(rows.filter((r) => r.a.status !== "paid").map((r) => r.amount));
  const paid = sumMoney(rows.filter((r) => r.a.status === "paid").map((r) => r.amount));

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:py-10">
      <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Submissions</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">
        Every campaign you&apos;re on, the post you sent, its views, and what it earns.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Posts submitted" value={String(submitted)} />
        <Stat label="Total views" value={totalViews.toLocaleString("en-US")} />
        <Stat label="Expected" value={formatCurrency(pending)} />
        <Stat label="Paid" value={formatCurrency(paid)} accent />
      </dl>

      {rows.length === 0 ? (
        <Card className="mt-8 border-border/70 py-10 text-center">
          <CardContent>
            <h2 className="font-heading text-lg font-semibold text-foreground">No submissions yet</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              When you&apos;re assigned to a campaign and send in your post, it shows up here with its views and pay.
            </p>
            <Link
              href="/dashboard/recruiting/jobs"
              className="mt-4 inline-block font-semibold text-primary underline underline-offset-2"
            >
              Browse open campaigns
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {rows.map(({ a, terms, views, amount, estimated }) => (
            <li key={a.id}>
              <Card className="border-border/70">
                <CardContent>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={assignmentStatusTone(a.status)}>{STATUS_LABEL[a.status] ?? a.status}</StatusBadge>
                        {a.jobs && <StatusBadge tone="neutral">{PLATFORM_LABELS[a.jobs.platform]}</StatusBadge>}
                      </div>
                      <h2 className="mt-3 font-heading text-lg font-semibold text-foreground">
                        {a.jobs?.title ?? "Campaign"}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Assigned {formatDate(a.assigned_at)}
                        {a.paid_at ? ` · paid ${formatDate(a.paid_at)}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-muted-foreground">
                        {a.status === "paid" ? "Paid" : estimated ? "Estimated so far" : "Pay"}
                      </p>
                      <p className="font-heading text-xl font-semibold text-primary">{formatCurrency(amount)}</p>
                    </div>
                  </div>

                  {terms && <PayStrip terms={terms} className="mt-4" />}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-[15px]">
                    <p className="text-foreground">
                      <span className="font-semibold">{views.toLocaleString("en-US")}</span> views
                    </p>
                    {a.proof_url ? (
                      <a
                        href={a.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary underline underline-offset-2"
                      >
                        View your post →
                      </a>
                    ) : (
                      <Link
                        href="/dashboard/recruiting#campaigns"
                        className="font-semibold text-primary underline underline-offset-2"
                      >
                        Send in your post →
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card px-4 py-3.5">
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className={accent ? "mt-1 font-heading text-2xl font-semibold text-primary" : "mt-1 font-heading text-2xl font-semibold text-foreground"}>
        {value}
      </dd>
    </div>
  );
}
