import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { STATE_LABEL, statementState, type StatementState } from "@/lib/direct-pay";
import type { CreatorStatement } from "@/lib/direct-pay-data";
import { sumMoney } from "@/lib/balance";
import { confirmReceivedAction } from "./direct-actions";
import { PayoutInstructionsForm, ReportNotPaid } from "./DirectForms";

const TONE: Record<StatementState, StatusTone> = {
  awaiting_payment: "pending",
  overdue: "error",
  brand_says_paid: "pending",
  confirmed: "success",
  disputed: "error",
};

export function DirectPayments({
  statements,
  payoutInstructions,
}: {
  statements: CreatorStatement[];
  payoutInstructions: string | null;
}) {
  const withState = statements.map((s) => ({ s, state: statementState(s) }));
  const owed = sumMoney(withState.filter((x) => x.state !== "confirmed").map((x) => x.s.amount));
  const received = sumMoney(withState.filter((x) => x.state === "confirmed").map((x) => x.s.amount));

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:py-10">
      <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Earnings</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">
        Brands pay you directly. We count your views, work out what you&apos;re owed and tell the brand to pay you. We never
        hold your money.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Owed to you" value={formatCurrency(owed)} accent />
        <Stat label="Received" value={formatCurrency(received)} />
      </dl>

      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">How you get paid</h2>
        <Card className="border-border/70">
          <CardContent>
            <PayoutInstructionsForm current={payoutInstructions} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Your payments</h2>
        {withState.length === 0 ? (
          <Card className="border-border/70">
            <CardContent>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                Nothing to collect yet. When your campaign is done we issue a statement and the brand is asked to pay you.
                It shows up here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {withState.map(({ s, state }) => (
              <li key={s.id}>
                <Card className="border-border/70">
                  <CardContent>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <StatusBadge tone={TONE[state]}>{STATE_LABEL[state]}</StatusBadge>
                        <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">{s.campaign}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {s.brand ? `${s.brand} · ` : ""}Issued {formatDate(s.issued_at)} · due {formatDate(s.due_at)}
                        </p>
                        {s.brand_paid_at && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            The brand says it paid on {formatDate(s.brand_paid_at)}
                            {s.brand_method ? ` by ${s.brand_method}` : ""}
                            {s.brand_reference ? ` (reference: ${s.brand_reference})` : ""}.
                          </p>
                        )}
                        {s.creator_confirmed_at && (
                          <p className="mt-1 text-sm font-semibold text-toy-soft-foreground">
                            You confirmed this on {formatDate(s.creator_confirmed_at)}.
                          </p>
                        )}
                        {s.creator_disputed_at && (
                          <p className="mt-1 text-sm text-destructive">
                            You reported this on {formatDate(s.creator_disputed_at)}. We&apos;re following up with the brand.
                          </p>
                        )}
                      </div>
                      <p className="font-heading text-2xl font-semibold text-primary">{formatCurrency(s.amount)}</p>
                    </div>

                    {state !== "confirmed" && (
                      <div className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-3 border-t border-border pt-4">
                        <form action={confirmReceivedAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <Button type="submit" size="sm">
                            I received this payment
                          </Button>
                        </form>
                        {(state === "brand_says_paid" || state === "overdue" || state === "disputed") && (
                          <ReportNotPaid id={s.id} />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-heading text-xl font-semibold tabular-nums ${accent ? "text-primary" : ""}`}>{value}</dd>
    </div>
  );
}
