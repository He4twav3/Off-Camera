import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { sumMoney } from "@/lib/balance";
import { DecisionForm } from "./DecisionForm";

export const metadata: Metadata = { title: "Withdrawals · Admin" };

const TONE = { requested: "pending", paid: "success", rejected: "error" } as const;
const LABEL = { requested: "Needs paying", paid: "Paid", rejected: "Rejected" } as const;

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("withdrawals")
    .select("id, amount, status, payout_details, paid_ref, admin_note, created_at, decided_at, applicants(name, email, handle)")
    .order("created_at", { ascending: true });

  const all = data ?? [];
  const waiting = all.filter((w) => w.status === "requested");
  const done = all.filter((w) => w.status !== "requested").reverse();
  const owed = sumMoney(waiting.map((w) => Number(w.amount)));

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Withdrawals</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {waiting.length} waiting ·{" "}
          <span className="font-semibold text-foreground">{formatCurrency(owed)}</span> to pay. Send each
          one by bank transfer (Wise or SEPA), then mark it paid here.
        </p>
      </header>

      {all.length === 0 ? (
        <Card className="border-border/70 py-12 text-center">
          <CardContent>
            <p className="text-[15px] text-muted-foreground">No withdrawal requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-10">
          {waiting.length > 0 && <Section title="Waiting to be paid" items={waiting} actionable />}
          {done.length > 0 && <Section title="Handled" items={done} />}
        </div>
      )}
    </div>
  );
}

type Row = {
  id: string;
  amount: number;
  status: "requested" | "paid" | "rejected";
  payout_details: string;
  paid_ref: string | null;
  admin_note: string | null;
  created_at: string;
  decided_at: string | null;
  applicants: { name: string; email: string; handle: string } | null;
};

function Section({ title, items, actionable }: { title: string; items: Row[]; actionable?: boolean }) {
  return (
    <section>
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">{title}</h2>
      <ul className="flex flex-col gap-4">
        {items.map((w) => (
          <li key={w.id}>
            <Card className="border-border/70">
              <CardContent>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <StatusBadge tone={TONE[w.status]}>{LABEL[w.status]}</StatusBadge>
                    <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                      {w.applicants?.name} (@{w.applicants?.handle})
                    </h3>
                    <p className="text-[15px] text-muted-foreground">{w.applicants?.email}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Requested {formatDate(w.created_at)}
                      {w.decided_at ? ` · decided ${formatDate(w.decided_at)}` : ""}
                    </p>
                  </div>
                  <p className="font-heading text-2xl font-semibold text-primary">{formatCurrency(w.amount)}</p>
                </div>

                <div className="mt-4 rounded-md bg-muted/50 p-3">
                  <p className="text-sm font-semibold text-muted-foreground">Pay to</p>
                  <p className="mt-1 break-words whitespace-pre-line text-[15px] text-foreground">{w.payout_details}</p>
                </div>

                {w.paid_ref && <p className="mt-3 text-sm text-muted-foreground">Reference: {w.paid_ref}</p>}
                {w.admin_note && <p className="mt-3 text-sm text-muted-foreground">Note: {w.admin_note}</p>}

                {actionable && (
                  <div className="mt-4 border-t border-border pt-4">
                    <DecisionForm id={w.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
