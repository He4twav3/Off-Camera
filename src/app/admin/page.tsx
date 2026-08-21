import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview · Admin" };

export default async function AdminHomePage() {
  const supabase = await createClient();

  // Counts only — `head: true` skips returning rows.
  const [
    pendingApplicants,
    pendingApplications,
    awaitingPayout,
    openJobs,
    disputed,
  ] = await Promise.all([
    supabase
      .from("applicants")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("assignments")
      .select("applicant_payout_amount")
      .eq("status", "submitted"),
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("assignments")
      .select("*", { count: "exact", head: true })
      .eq("status", "disputed"),
  ]);

  const owed = (awaitingPayout.data ?? []).reduce(
    (sum, a) => sum + Number(a.applicant_payout_amount),
    0,
  );

  const queue = [
    {
      label: "Applications to decide",
      value: pendingApplications.count ?? 0,
      href: "/admin/applications",
      urgent: (pendingApplications.count ?? 0) > 0,
    },
    {
      label: "Creators to review",
      value: pendingApplicants.count ?? 0,
      href: "/admin/applicants",
      urgent: (pendingApplicants.count ?? 0) > 0,
    },
    {
      label: "Posts awaiting payout",
      value: awaitingPayout.data?.length ?? 0,
      href: "/admin/payouts",
      urgent: (awaitingPayout.data?.length ?? 0) > 0,
    },
    {
      label: "Disputes open",
      value: disputed.count ?? 0,
      href: "/admin/payouts",
      urgent: (disputed.count ?? 0) > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Overview
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {openJobs.count ?? 0} open{" "}
          {(openJobs.count ?? 0) === 1 ? "campaign" : "campaigns"} ·{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(owed)}
          </span>{" "}
          owed out to creators
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {queue.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="block h-full">
              <Card className="h-full border-border/70 transition-colors hover:bg-muted/40">
                <CardContent>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {item.label}
                  </p>
                  <p
                    className={
                      "mt-2 font-heading text-4xl font-semibold tabular-nums " +
                      (item.urgent ? "text-primary" : "text-muted-foreground")
                    }
                  >
                    {item.value}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
          Manage
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { href: "/admin/jobs", label: "Campaigns", body: "Post, edit and close campaigns." },
            { href: "/admin/applicants", label: "Creators", body: "Approve, reject and assign." },
            { href: "/admin/niches", label: "Niches", body: "Edit the niche list creators pick from." },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="block h-full">
              <Card className="h-full border-border/70 transition-colors hover:bg-muted/40">
                <CardContent>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {l.label}
                  </h3>
                  <p className="mt-1 text-[15px] text-muted-foreground">
                    {l.body}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
