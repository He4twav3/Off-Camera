import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, jobStatusTone } from "@/components/ui/status-badge";
import { JobForm } from "./JobForm";
import { deleteJobAction } from "./actions";
import {
  PLATFORM_LABELS,
  ACCOUNT_REQUIREMENT_LABELS,
  formatPayoutSummary,
  formatDate,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Jobs · Admin" };

export default async function AdminJobsPage() {
  const supabase = await createClient();

  const [{ data: jobs }, { data: niches }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, niches(label)")
      .order("created_at", { ascending: false }),
    supabase
      .from("niches")
      .select("id, label")
      .eq("is_active", true)
      .order("label"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">
            Jobs
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Every campaign here is entered by hand. Nothing is imported from
            anywhere.
          </p>
        </div>
        <JobForm niches={niches ?? []} />
      </header>

      {!jobs || jobs.length === 0 ? (
        <Card className="border-border/70 py-12 text-center">
          <CardContent>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              No jobs yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
              Create your first campaign with the “New job” button above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <Card className="border-border/70">
                <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={jobStatusTone(job.status)}>
                        {job.status === "open"
                          ? "Open"
                          : job.status === "filled"
                            ? "Filled"
                            : "Closed"}
                      </StatusBadge>
                      <StatusBadge tone="neutral">
                        {PLATFORM_LABELS[job.platform]}
                      </StatusBadge>
                      {job.niches && (
                        <StatusBadge tone="neutral">{job.niches.label}</StatusBadge>
                      )}
                    </div>
                    <h2 className="mt-3 font-heading text-lg font-semibold text-foreground">
                      {job.title}
                    </h2>
                    <p className="mt-1 text-[15px] text-muted-foreground">
                      {formatPayoutSummary(job.payout_type, job.payout_amount)}{" "}
                      · {ACCOUNT_REQUIREMENT_LABELS[job.account_requirement]} ·
                      Created {formatDate(job.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-3">
                    <JobForm niches={niches ?? []} job={job} />
                    <form action={deleteJobAction}>
                      <input type="hidden" name="id" value={job.id} />
                      <button
                        type="submit"
                        className="min-h-9 cursor-pointer px-2 text-sm font-semibold text-destructive underline underline-offset-2 transition-opacity duration-200 hover:opacity-80"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
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
