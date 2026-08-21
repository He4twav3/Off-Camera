"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatPayoutSummary, PLATFORM_LABELS } from "@/lib/utils";
import {
  withdrawApplicationAction,
  type ApplyState,
} from "@/app/dashboard/recruiting/jobs/[id]/actions";

const STATUS_TONE = {
  pending: "pending",
  accepted: "success",
  declined: "error",
  withdrawn: "closed",
} as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting to hear back",
  accepted: "Accepted",
  declined: "Not this time",
  withdrawn: "You withdrew this",
};

export interface ApplicationRow {
  id: string;
  status: keyof typeof STATUS_TONE;
  created_at: string;
  jobs: {
    id: string;
    title: string;
    platform: string;
    payout_type: "flat" | "cpm" | "retainer";
    payout_amount: number;
  } | null;
}

function WithdrawButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 cursor-pointer text-sm font-semibold text-muted-foreground underline underline-offset-2 transition-colors duration-200 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Withdrawing…" : "Withdraw application"}
    </button>
  );
}

export function ApplicationsList({ applications }: { applications: ApplicationRow[] }) {
  const [state, formAction] = useActionState<ApplyState, FormData>(
    withdrawApplicationAction,
    {},
  );

  return (
    <section>
      <h2 className="mb-5 font-heading text-xl font-semibold text-foreground">
        Your applications
      </h2>

      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          {state.error}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {applications.map((app) => {
          const job = app.jobs;
          return (
            <li key={app.id}>
              <Card className="border-border/70">
              <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {job ? (
                        <Link
                          href={`/dashboard/recruiting/jobs/${job.id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {job.title}
                        </Link>
                      ) : (
                        "Campaign no longer listed"
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Applied {formatDate(app.created_at)}
                      {job
                        ? ` · ${PLATFORM_LABELS[job.platform]} · ${formatPayoutSummary(job.payout_type, job.payout_amount)}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[app.status]}>
                    {STATUS_LABELS[app.status]}
                  </StatusBadge>
                </div>

                {app.status === "pending" && (
                  <div className="mt-4 border-t border-border pt-4">
                    <form action={formAction}>
                      <input
                        type="hidden"
                        name="application_id"
                        value={app.id}
                      />
                      <WithdrawButton />
                    </form>
                  </div>
                )}

                {app.status === "declined" && (
                  <p className="mt-3 text-[15px] text-muted-foreground">
                    This one went to someone else. It doesn&apos;t affect any
                    other campaign you apply for.
                  </p>
                )}
              </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
