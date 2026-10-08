import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  RowList,
  Row,
  Notice,
} from "@/components/kit/ui";
import type { StatusTone } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  STATE_LABEL,
  statementState,
  type StatementState,
} from "@/lib/direct-pay";
import type { CreatorStatement } from "@/lib/direct-pay-data";
import { sumMoney } from "@/lib/balance";
import { confirmReceivedAction } from "./direct-actions";
import { ReportNotPaid } from "./DirectForms";
import { MyCampaigns } from "@/components/tracking/MyCampaigns";
import type { MyCampaignRow } from "@/lib/my-campaigns";

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
  campaigns = [],
  campaignHref,
  campaignsPath = "/dashboard/recruiting/jobs",
  accountPath = "/dashboard/account/payments",
}: {
  statements: CreatorStatement[];
  payoutInstructions: string | null;
  /** The campaigns you've joined, each with its tracking. */
  campaigns?: MyCampaignRow[];
  campaignHref?: (row: MyCampaignRow) => string;
  campaignsPath?: string;
  accountPath?: string;
}) {
  const withState = statements.map((s) => ({ s, state: statementState(s) }));
  const owed = sumMoney(
    withState.filter((x) => x.state !== "confirmed").map((x) => x.s.amount),
  );
  const received = sumMoney(
    withState.filter((x) => x.state === "confirmed").map((x) => x.s.amount),
  );
  const empty = withState.length === 0 && campaigns.length === 0;

  return (
    <PageShell>
      <PageHeader
        title="Earnings"
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={accountPath} />}
          >
            Payment details
            <ArrowRight className="size-4" />
          </Button>
        }
      />

      {/* The big number, and where to go when there isn't one yet. */}
      <section className="rounded-xl border border-border/70 bg-card px-6 py-6">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Owed to you
        </p>
        <p className="mt-1 font-heading text-5xl font-semibold tabular-nums text-foreground">
          {formatCurrency(owed)}
        </p>
        {empty ? (
          <div className="mx-auto mt-6 max-w-md pb-4 text-center">
            <p className="font-heading text-xl font-semibold text-foreground">
              Start earning
            </p>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Join a campaign and post your video. When it&apos;s done, we count
              your views and the brand is asked to pay you. It shows up here.
            </p>
            <Button
              className="mt-5"
              nativeButton={false}
              render={<Link href={campaignsPath} />}
            >
              Explore campaigns
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Brands pay you directly. We count your views and tell the brand what
            to pay. We never hold your money.
          </p>
        )}
      </section>

      {!payoutInstructions && (
        <div className="mt-4">
          <Notice>
            Brands can&apos;t pay you until they know where.{" "}
            <Link
              href={accountPath}
              className="font-semibold text-primary underline underline-offset-2"
            >
              Add your payment details
            </Link>
          </Notice>
        </div>
      )}

      <dl className="mt-4 mb-8 grid grid-cols-2 divide-x divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card lg:grid-cols-4">
        <Cell label="Owed" value={formatCurrency(owed)} />
        <Cell label="Received" value={formatCurrency(received)} />
        <Cell label="Total" value={formatCurrency(owed + received)} />
        <Cell label="Payments" value={String(withState.length)} />
      </dl>

      <MyCampaigns
        rows={campaigns}
        hrefFor={campaignHref}
        note="What you've earned on each campaign so far. A payment shows under Your payments once the statement is issued."
      />

      {withState.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
            Your payments
          </h2>
          <RowList>
            {withState.map(({ s, state }) => (
              <Row
                key={s.id}
                title={s.campaign}
                meta={`${s.brand ? `${s.brand} · ` : ""}issued ${formatDate(s.issued_at)} · due ${formatDate(s.due_at)}`}
                status={STATE_LABEL[state]}
                statusTone={TONE[state]}
                figure={formatCurrency(s.amount)}
                defaultOpen={state === "overdue" || state === "disputed"}
                details={
                  <div className="flex flex-col gap-3">
                    {s.brand_paid_at && (
                      <Notice>
                        The brand says it paid on {formatDate(s.brand_paid_at)}
                        {s.brand_method ? ` by ${s.brand_method}` : ""}
                        {s.brand_reference
                          ? ` (reference: ${s.brand_reference})`
                          : ""}
                        .
                      </Notice>
                    )}
                    {s.creator_confirmed_at && (
                      <Notice>
                        You confirmed this on{" "}
                        {formatDate(s.creator_confirmed_at)}.
                      </Notice>
                    )}
                    {s.creator_disputed_at && (
                      <Notice tone="warn">
                        You reported this on {formatDate(s.creator_disputed_at)}
                        . We&apos;re following up with the brand.
                      </Notice>
                    )}
                    {state !== "confirmed" && (
                      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
                        <form action={confirmReceivedAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <Button type="submit" size="sm">
                            I received this payment
                          </Button>
                        </form>
                        {(state === "brand_says_paid" ||
                          state === "overdue" ||
                          state === "disputed") && <ReportNotPaid id={s.id} />}
                      </div>
                    )}
                  </div>
                }
              />
            ))}
          </RowList>
        </section>
      )}
    </PageShell>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-heading text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
