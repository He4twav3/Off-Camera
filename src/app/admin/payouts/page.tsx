import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, assignmentStatusTone } from "@/components/ui/status-badge";
import { PayoutForm } from "./PayoutForm";
import { setAssignmentStatusAction } from "./actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calculatePayout, parsePayoutTerms } from "@/lib/payout-terms";

export const metadata: Metadata = { title: "Payouts · Admin" };

const STATUS_LABELS: Record<string, string> = {
  active: "In progress",
  submitted: "Awaiting payout",
  paid: "Released to creator",
  disputed: "Disputed",
};

export default async function AdminPayoutsPage() {
  const supabase = await createClient();

  // Assignments that need attention first: submitted (proof in, not yet paid),
  // then disputed, then everything else.
  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "id, status, proof_url, applicant_payout_amount, assigned_at, paid_at, applicants(name, email, handle), jobs(title, payout_terms), payouts(gross_amount, notes, paid_at, brand_paid_at, brand_payment_ref)",
    )
    .order("assigned_at", { ascending: false });

  const { data: viewRows } = await supabase
    .from("campaign_views")
    .select("campaign, handle, views");
  const norm = (v: string) => v.trim().replace(/^@+/, "").toLowerCase();
  const viewsByKey = new Map<string, number>();
  for (const r of viewRows ?? []) {
    const key = `${norm(r.campaign)}|${norm(r.handle)}`;
    viewsByKey.set(key, (viewsByKey.get(key) ?? 0) + Number(r.views));
  }
  // Suggested payout per assignment from the campaign's formula and the views
  // counted for the creator's handle. A suggestion only; the admin still enters
  // the real amounts below.
  const suggestions = new Map<string, Suggestion>();
  for (const a of assignments ?? []) {
    const terms = parsePayoutTerms(a.jobs?.payout_terms);
    if (!terms || !a.jobs || !a.applicants) continue;
    const views = viewsByKey.get(`${norm(a.jobs.title)}|${norm(a.applicants.handle)}`) ?? 0;
    suggestions.set(a.id, { views, breakdown: calculatePayout(terms, views) });
  }

  const all = assignments ?? [];
  const awaiting = all.filter((a) => a.status === "submitted");
  const disputed = all.filter((a) => a.status === "disputed");
  const others = all.filter(
    (a) => a.status !== "submitted" && a.status !== "disputed",
  );

  const totalOwed = awaiting.reduce(
    (sum, a) => sum + Number(a.applicant_payout_amount),
    0,
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Payouts
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {awaiting.length} awaiting payout ·{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(totalOwed)}
          </span>{" "}
          outstanding to creators
        </p>
      </header>

      {all.length === 0 ? (
        <Card className="border-border/70 py-12 text-center">
          <CardContent>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              No assignments yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
              Assign an approved applicant to a job and it&apos;ll show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-10">
          {awaiting.length > 0 && (
            <Section title="Awaiting payout" items={awaiting} suggestions={suggestions} />
          )}
          {disputed.length > 0 && <Section title="Disputed" items={disputed} suggestions={suggestions} />}
          {others.length > 0 && <Section title="Everything else" items={others} suggestions={suggestions} />}
        </div>
      )}
    </div>
  );
}

type AssignmentRow = {
  id: string;
  status: string;
  proof_url: string | null;
  applicant_payout_amount: number;
  assigned_at: string;
  paid_at: string | null;
  applicants: { name: string; email: string; handle: string } | null;
  jobs: { title: string; payout_terms: Record<string, unknown> | null } | null;
  // `payouts.assignment_id` is a unique FK, so PostgREST embeds this as a
  // single object (or null) rather than an array.
  payouts: {
    gross_amount: number;
    notes: string | null;
    paid_at: string | null;
    brand_paid_at: string | null;
    brand_payment_ref: string | null;
  } | null;
};

type Suggestion = { views: number; breakdown: ReturnType<typeof calculatePayout> };

function Section({
  title,
  items,
  suggestions,
}: {
  title: string;
  items: AssignmentRow[];
  suggestions: Map<string, Suggestion>;
}) {
  return (
    <section>
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
        {title}
      </h2>
      <ul className="flex flex-col gap-4">
        {items.map((a) => {
          const payout = a.payouts;
          const margin = payout
            ? Number(payout.gross_amount) - Number(a.applicant_payout_amount)
            : null;

          return (
            <li key={a.id}>
              <Card className="border-border/70">
                <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={assignmentStatusTone(a.status)}>
                        {STATUS_LABELS[a.status]}
                      </StatusBadge>
                      <StatusBadge tone={payout?.brand_paid_at ? "success" : "neutral"}>
                        {payout?.brand_paid_at ? "Brand paid" : "Not funded yet"}
                      </StatusBadge>
                    </div>
                    <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                      {a.jobs?.title ?? "Campaign"}
                    </h3>
                    <p className="mt-1 text-[15px] text-muted-foreground">
                      {a.applicants?.name} (@{a.applicants?.handle}) ·{" "}
                      {a.applicants?.email}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Assigned {formatDate(a.assigned_at)}
                      {a.paid_at ? ` · Paid ${formatDate(a.paid_at)}` : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-muted-foreground">
                      Creator payout
                    </p>
                    <p className="font-heading text-xl font-semibold text-primary">
                      {formatCurrency(a.applicant_payout_amount)}
                    </p>
                    {suggestions.get(a.id) && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Formula: brand pays{" "}
                        <span className="font-semibold text-foreground">
                          {formatCurrency(suggestions.get(a.id)!.breakdown.total)}
                        </span>{" "}
                        at {suggestions.get(a.id)!.views.toLocaleString()} views
                      </p>
                    )}
                    {margin !== null && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Margin{" "}
                        <span className="font-semibold text-foreground">
                          {formatCurrency(margin)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {a.proof_url && (
                  <p className="mt-4 text-[15px]">
                    <span className="font-semibold text-foreground">
                      Submitted post:{" "}
                    </span>
                    <a
                      href={a.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      {a.proof_url}
                    </a>
                  </p>
                )}

                <div className="mt-4 border-t border-border pt-4">
                  <PayoutForm
                    assignmentId={a.id}
                    alreadyPaid={a.status === "paid"}
                    creatorPayout={Number(a.applicant_payout_amount)}
                    existing={
                      payout
                        ? {
                            gross_amount: payout.gross_amount,
                            notes: payout.notes,
                            brand_paid_at: payout.brand_paid_at,
                            brand_payment_ref: payout.brand_payment_ref,
                          }
                        : null
                    }
                  />

                  {a.status !== "disputed" && a.status !== "paid" && (
                    <form action={setAssignmentStatusAction} className="mt-4">
                      <input type="hidden" name="assignment_id" value={a.id} />
                      <input type="hidden" name="status" value="disputed" />
                      <button
                        type="submit"
                        className="min-h-11 cursor-pointer text-sm font-semibold text-destructive underline underline-offset-2 transition-opacity duration-200 hover:opacity-80"
                      >
                        Flag as disputed
                      </button>
                    </form>
                  )}

                  {a.status === "disputed" && (
                    <form action={setAssignmentStatusAction} className="mt-4">
                      <input type="hidden" name="assignment_id" value={a.id} />
                      <input type="hidden" name="status" value="submitted" />
                      <button
                        type="submit"
                        className="min-h-11 cursor-pointer text-sm font-semibold text-primary underline underline-offset-2 transition-opacity duration-200 hover:opacity-80"
                      >
                        Resolve — back to awaiting payout
                      </button>
                    </form>
                  )}
                </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
