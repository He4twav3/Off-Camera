import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import type { StatusTone } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BRAND_METHODS,
  STATE_LABEL,
  type StatementState,
} from "@/lib/direct-pay";
import {
  EmptyState,
  Facts,
  Initial,
  Notice,
  PageHeader,
  PageShell,
  Row,
  RowList,
  Stat,
  StatGrid,
  Tabs,
  type TabItem,
} from "@/components/kit/ui";
import { IssueForm } from "./IssueForm";
import {
  acceptPostAction,
  adminMarkBrandPaidAction,
  rejectPostAction,
  toggleFeeReceivedAction,
  voidStatementAction,
} from "./actions";

export type StatementRowData = {
  id: string;
  status: string;
  views: number;
  proof_url: string | null;
  suggested: number | null;
  applicants: { name: string; email: string; handle: string } | null;
  jobs: {
    title: string;
    brand_accounts: { company_name: string } | null;
  } | null;
  direct_payments: {
    id: string;
    cycle: number;
    amount: number;
    issued_at: string;
    due_at: string;
    brand_paid_at: string | null;
    brand_method: string | null;
    brand_reference: string | null;
    creator_confirmed_at: string | null;
    creator_disputed_at: string | null;
    creator_dispute_note: string | null;
    our_fee: number;
    fee_received_at: string | null;
  } | null;
  state: StatementState | null;
  /** For a campaign paid per post: the contract's numbers and the posts behind them. */
  perPost?: {
    earned: number;
    payable: number;
    statemented: number;
    nextCycle: number;
    counted: number;
    posts: {
      id: string;
      platform: string;
      url: string;
      state: "counting" | "final" | "rejected";
      authorVerified: boolean;
      views: number;
      windowEndsAt: string | null;
      rejectReason: string | null;
      lastError: string | null;
    }[];
  };
};

const STATE_TONE: Record<StatementState, StatusTone> = {
  awaiting_payment: "pending",
  overdue: "error",
  brand_says_paid: "pending",
  confirmed: "success",
  disputed: "error",
};

const TABS = ["attention", "ready", "waiting", "paid"] as const;
type TabKey = (typeof TABS)[number];

export function StatementsView({
  rows,
  tab,
}: {
  rows: StatementRowData[];
  tab?: string;
}) {
  const ready = rows.filter(
    (r) => r.status === "submitted" && !r.direct_payments,
  );
  const withStatement = rows.filter((r) => r.direct_payments);
  const lists: Record<TabKey, StatementRowData[]> = {
    attention: withStatement.filter(
      (r) => r.state === "disputed" || r.state === "overdue",
    ),
    ready,
    waiting: withStatement.filter(
      (r) => r.state === "awaiting_payment" || r.state === "brand_says_paid",
    ),
    paid: withStatement.filter((r) => r.state === "confirmed"),
  };

  // Open on the first tab that has something in it.
  // The paid list is the archive: never opened by default.
  const firstWithItems =
    TABS.find((k) => k !== "paid" && lists[k].length > 0) ?? "ready";
  const active: TabKey = (TABS as readonly string[]).includes(tab ?? "")
    ? (tab as TabKey)
    : firstWithItems;

  const owedToCreators = withStatement
    .filter((r) => r.state !== "confirmed")
    .reduce((n, r) => n + Number(r.direct_payments!.amount), 0);
  const feesOutstanding = withStatement
    .filter((r) => !r.direct_payments!.fee_received_at)
    .reduce((n, r) => n + Number(r.direct_payments!.our_fee), 0);

  const tabs: TabItem[] = [
    {
      key: "attention",
      label: "Attention",
      count: lists.attention.length,
      attention: true,
    },
    {
      key: "ready",
      label: "Ready",
      count: lists.ready.length,
      attention: true,
    },
    { key: "waiting", label: "Waiting", count: lists.waiting.length },
  ].map((t) => ({ ...t, href: `/admin/statements?tab=${t.key}` }));

  const items = lists[active];

  return (
    <PageShell>
      <PageHeader
        title="Statements"
        summary="Brands pay creators directly. You issue the statement and keep track of who has paid and what the brands owe us."
      />

      <StatGrid>
        <Stat
          label="Needs attention"
          value={String(lists.attention.length)}
          attention={lists.attention.length > 0}
        />
        <Stat
          label="Ready to issue"
          value={String(lists.ready.length)}
          attention={lists.ready.length > 0}
        />
        <Stat
          label="Brands owe creators"
          value={formatCurrency(owedToCreators)}
        />
        <Stat
          label="Brands owe us (fees)"
          value={formatCurrency(feesOutstanding)}
          attention={feesOutstanding > 0}
        />
      </StatGrid>

      {active === "paid" ? (
        <Link href="/admin/statements" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Payments
        </Link>
      ) : (
        <Tabs items={tabs} active={active} />
      )}
      {active === "paid" && <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Archive</h2>}

      {items.length === 0 ? (
        <EmptyState title={EMPTY[active].title} body={EMPTY[active].body} />
      ) : (
        <RowList>
          {items.map((r) =>
            active === "ready" ? (
              <ReadyRow key={r.id} row={r} />
            ) : (
              <StatementRow key={r.direct_payments?.id ?? r.id} row={r} />
            ),
          )}
        </RowList>
      )}

      {active !== "paid" && (
        <Link
          href="/admin/statements?tab=paid"
          className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Archive ({lists.paid.length})
          <ChevronRight className="size-3" />
        </Link>
      )}
    </PageShell>
  );
}

const EMPTY: Record<TabKey, { title: string; body: string }> = {
  attention: {
    title: "Nothing needs attention",
    body: "Overdue statements and creators who report not being paid show up here.",
  },
  ready: {
    title: "Nothing to issue",
    body: "When a creator submits their post, it appears here, ready for a statement.",
  },
  waiting: {
    title: "Nothing waiting",
    body: "Issued statements that brands haven't paid yet show up here.",
  },
  paid: {
    title: "Nothing archived yet",
    body: "Payments the creator has confirmed receiving are kept here.",
  },
};

function brandOf(r: StatementRowData) {
  return r.jobs?.brand_accounts?.company_name ?? "no brand attached";
}

function ReadyRow({ row: r }: { row: StatementRowData }) {
  return (
    <Row
      leading={<Initial name={r.applicants?.name ?? "?"} />}
      title={r.applicants?.name ?? "Creator"}
      meta={`@${r.applicants?.handle ?? ""} · ${r.jobs?.title ?? "Campaign"} · ${brandOf(r)}`}
      status="Ready to issue"
      statusTone="pending"
      figure={r.suggested !== null ? formatCurrency(r.suggested) : "—"}
      figureLabel={
        r.perPost ? `Due now · cycle ${r.perPost.nextCycle}` : "Formula says"
      }
      figureNote={
        r.perPost
          ? `${r.perPost.counted} posts · ${formatCurrency(r.perPost.earned)} earned · ${formatCurrency(r.perPost.statemented)} already covered`
          : `${r.views.toLocaleString()} views so far`
      }
      details={
        <div className="flex flex-col gap-4">
          {r.proof_url && (
            <p className="text-sm">
              <a
                href={r.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline underline-offset-2"
              >
                Open the submitted post
              </a>
            </p>
          )}
          {r.perPost && <PostsList posts={r.perPost.posts} />}
          {!r.jobs?.brand_accounts && (
            <Notice>
              This campaign has no brand account attached, so nobody will be
              emailed to pay. You&apos;ll record the payment yourself.
            </Notice>
          )}
          <IssueForm assignmentId={r.id} suggestedAmount={r.suggested} />
        </div>
      }
      detailsLabel="Issue statement"
    />
  );
}

function StatementRow({ row: r }: { row: StatementRowData }) {
  const dp = r.direct_payments!;
  const state = r.state!;
  const open = !dp.brand_paid_at && !dp.creator_confirmed_at;
  const fee = Number(dp.our_fee);

  return (
    <Row
      leading={<Initial name={r.applicants?.name ?? "?"} />}
      title={r.applicants?.name ?? "Creator"}
      meta={`@${r.applicants?.handle ?? ""} · ${r.jobs?.title ?? "Campaign"}${r.perPost ? ` · payment ${dp.cycle}` : ""} · ${brandOf(r)}`}
      status={STATE_LABEL[state]}
      statusTone={STATE_TONE[state]}
      figure={formatCurrency(Number(dp.amount))}
      figureLabel="Brand owes creator"
      figureNote={
        fee > 0
          ? `Our fee ${formatCurrency(fee)}${dp.fee_received_at ? " · received" : " · not received"}`
          : undefined
      }
      defaultOpen={state === "disputed"}
      details={
        <div className="flex flex-col gap-4">
          {dp.creator_disputed_at && (
            <Notice tone="warn">
              <span className="font-semibold">
                Creator says they weren&apos;t paid
              </span>{" "}
              ({formatDate(dp.creator_disputed_at)}):{" "}
              {dp.creator_dispute_note
                ? `“${dp.creator_dispute_note.replace(/[.\s]+$/, "")}”`
                : "no note"}
              . Follow up with the brand.
            </Notice>
          )}

          <Facts
            items={[
              { label: "Issued", value: formatDate(dp.issued_at) },
              { label: "Due", value: formatDate(dp.due_at) },
              { label: "Creator email", value: r.applicants?.email ?? "—" },
              {
                label: "Brand says paid",
                value: dp.brand_paid_at
                  ? `${formatDate(dp.brand_paid_at)}${dp.brand_method ? ` · ${dp.brand_method}` : ""}${dp.brand_reference ? ` · ${dp.brand_reference}` : ""}`
                  : "Not yet",
              },
              {
                label: "Creator confirmed",
                value: dp.creator_confirmed_at
                  ? formatDate(dp.creator_confirmed_at)
                  : "Not yet",
              },
              {
                label: "Our fee",
                value:
                  fee > 0
                    ? `${formatCurrency(fee)} · ${dp.fee_received_at ? "received" : "not received"}`
                    : "None",
              },
            ]}
          />

          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            {open && (
              <form
                action={adminMarkBrandPaidAction}
                className="flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="id" value={dp.id} />
                <Field label="Brand told us it paid" htmlFor={`m-${dp.id}`}>
                  <Select
                    id={`m-${dp.id}`}
                    name="method"
                    defaultValue={BRAND_METHODS[0]}
                  >
                    {BRAND_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Reference (optional)" htmlFor={`r-${dp.id}`}>
                  <Input id={`r-${dp.id}`} name="reference" maxLength={200} />
                </Field>
                <Button type="submit" variant="outline" size="sm">
                  Record as paid
                </Button>
              </form>
            )}

            {fee > 0 && (
              <form action={toggleFeeReceivedAction}>
                <input type="hidden" name="id" value={dp.id} />
                <Button type="submit" variant="outline" size="sm">
                  {dp.fee_received_at
                    ? "Mark our fee as not received"
                    : "Mark our fee as received"}
                </Button>
              </form>
            )}

            {open && (
              <form action={voidStatementAction}>
                <input type="hidden" name="id" value={dp.id} />
                <button
                  type="submit"
                  className="min-h-9 cursor-pointer text-sm font-semibold text-destructive underline underline-offset-2 transition-opacity hover:opacity-80"
                >
                  Void this statement
                </button>
              </form>
            )}
          </div>
        </div>
      }
      detailsLabel="Details"
    />
  );
}

function PostsList({
  posts,
}: {
  posts: NonNullable<StatementRowData["perPost"]>["posts"];
}) {
  if (posts.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No posts submitted yet.</p>
    );
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">Posts</p>
      <ul className="divide-y divide-border/70 rounded-lg border border-border/70">
        {posts.map((p) => {
          const needsLook = p.state === "counting" && !p.authorVerified;
          return (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 text-sm"
            >
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 basis-48 truncate font-semibold text-primary underline underline-offset-2"
              >
                {p.url.replace(/^https:\/\/(www\.)?/, "")}
              </a>
              <span className="text-muted-foreground">
                {p.state === "rejected"
                  ? `Rejected: ${p.rejectReason ?? ""}`
                  : needsLook
                    ? `Not confirmed${p.lastError ? `: ${p.lastError}` : ""}`
                    : `${p.views.toLocaleString()} views · ${p.state === "final" ? "final" : "counting"}`}
              </span>
              <div className="flex gap-3">
                {(needsLook || p.state === "rejected") && (
                  <form action={acceptPostAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="cursor-pointer text-sm font-semibold text-primary underline underline-offset-2"
                    >
                      Accept
                    </button>
                  </form>
                )}
                {p.state !== "rejected" && (
                  <form action={rejectPostAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="cursor-pointer text-sm font-semibold text-destructive underline underline-offset-2"
                    >
                      Reject
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
