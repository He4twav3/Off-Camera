import type { StatusTone } from "@/components/ui/status-badge";
import { PLATFORM_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { statementState, type StatementState } from "@/lib/direct-pay";
import type { BrandCampaign } from "@/lib/brand-data";
import type { BrandStatement } from "@/lib/direct-pay-data";
import { StatusBadge } from "@/components/ui/status-badge";
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
import { PayCreatorForm } from "./PayCreatorForm";

const CREATOR_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  active: { label: "In progress", tone: "open" },
  submitted: { label: "Post submitted", tone: "pending" },
  paid: { label: "Completed", tone: "success" },
  disputed: { label: "Needs attention", tone: "error" },
};

const CAMPAIGN_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  open: { label: "Open", tone: "open" },
  filled: { label: "Filled", tone: "closed" },
  closed: { label: "Closed", tone: "closed" },
};

// What the brand sees for each stage of a payment.
const PAYMENT_TONE: Record<StatementState, StatusTone> = {
  awaiting_payment: "pending",
  overdue: "error",
  brand_says_paid: "pending",
  confirmed: "success",
  disputed: "error",
};

function paymentLabel(state: StatementState, due: string): string {
  switch (state) {
    case "awaiting_payment":
      return `Due ${formatDate(due)}`;
    case "overdue":
      return "Overdue";
    case "brand_says_paid":
      return "Waiting for creator to confirm";
    case "confirmed":
      return "Paid";
    case "disputed":
      return "Creator says not received";
  }
}

export type BrandView = {
  firstName: string;
  company: string;
  status: "pending" | "approved" | "rejected";
  campaigns: BrandCampaign[];
  statements: BrandStatement[];
};

export function BrandDashboardView({ brand, tab }: { brand: BrandView; tab?: string }) {
  const { campaigns, statements } = brand;
  const approved = brand.status === "approved";

  const toPay = statements.filter((s) => !s.brand_paid_at && !s.creator_confirmed_at);
  const unsettled = statements.filter((s) => statementState(s) !== "confirmed");
  const amountToPay = toPay.reduce((n, s) => n + s.amount, 0);
  const creatorCount = campaigns.reduce((n, c) => n + c.creators.length, 0);
  const totalViews = campaigns.reduce((n, c) => n + c.totalViews, 0);

  const showPayments = statements.length > 0;
  const defaultTab = showPayments && unsettled.length > 0 ? "payments" : "campaigns";
  const active = tab === "payments" && showPayments ? "payments" : tab === "campaigns" ? "campaigns" : defaultTab;

  const tabs: TabItem[] = [
    ...(showPayments
      ? [{ key: "payments", label: "Payments", count: unsettled.length, href: "/brand?tab=payments", attention: true }]
      : []),
    { key: "campaigns", label: "Campaigns", count: campaigns.length, href: "/brand?tab=campaigns" },
  ];

  return (
    <PageShell>
      <PageHeader title={`Hi, ${brand.firstName}`} summary={brand.company} />

      {!approved ? (
        <EmptyState
          title={brand.status === "pending" ? "Your account is under review" : "Your account wasn’t approved"}
          body={
            brand.status === "pending"
              ? "We review new brands by hand, usually within a day or two. You'll see your campaigns here as soon as you're approved."
              : "If you think that's a mistake, get in touch and we'll take another look."
          }
        />
      ) : (
        <>
          <StatGrid>
            <Stat label="Campaigns" value={campaigns.length.toLocaleString()} />
            <Stat label="Creators" value={creatorCount.toLocaleString()} />
            <Stat label="Total views" value={totalViews.toLocaleString()} />
            {showPayments && (
              <Stat
                label="To pay"
                value={formatCurrency(amountToPay)}
                attention={amountToPay > 0}
                hint={toPay.length > 0 ? `${toPay.length} ${toPay.length === 1 ? "creator" : "creators"}` : "All paid"}
              />
            )}
          </StatGrid>

          <Tabs items={tabs} active={active} />

          {active === "payments" ? (
            <div className="flex flex-col gap-4">
              <Notice>
                You pay each creator directly, the way they asked, from your own account. Send the full amount in US dollars
                and cover any transfer fees so they receive all of it. Then mark it as paid here so they can confirm.
              </Notice>
              <RowList>
                {statements.map((s) => (
                  <PaymentRow key={s.id} s={s} />
                ))}
              </RowList>
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState title="No campaigns yet" body="Your campaigns will appear here once we set them up with you." />
          ) : (
            <RowList>
              {campaigns.map((c) => (
                <CampaignRow key={c.id} c={c} />
              ))}
            </RowList>
          )}
        </>
      )}
    </PageShell>
  );
}

function PaymentRow({ s }: { s: BrandStatement }) {
  const state = statementState(s);
  const marked = Boolean(s.brand_paid_at || s.creator_confirmed_at);
  return (
    <Row
      leading={<Initial name={s.creatorName} />}
      title={s.creatorName}
      meta={`@${s.creatorHandle} · ${s.campaign}`}
      status={paymentLabel(state, s.due_at)}
      statusTone={PAYMENT_TONE[state]}
      figure={formatCurrency(s.amount)}
      figureLabel="Amount"
      details={
        <div className="flex flex-col gap-4">
          <Facts
            items={[
              {
                label: "Pay to",
                value: state === "confirmed" ? "—" : (s.payTo ?? "The creator hasn't added payment details yet. We've asked them to."),
              },
              { label: "Due", value: formatDate(s.due_at) },
              { label: "Campaign", value: s.campaign },
              ...(s.brand_paid_at
                ? [
                    {
                      label: "You marked it paid",
                      value: `${formatDate(s.brand_paid_at)}${s.brand_method ? ` · ${s.brand_method}` : ""}${s.brand_reference ? ` · ${s.brand_reference}` : ""}`,
                    },
                  ]
                : []),
            ]}
          />
          {!marked && <PayCreatorForm id={s.id} />}
        </div>
      }
      detailsLabel={marked ? "Details" : "Pay"}
    />
  );
}

function CampaignRow({ c }: { c: BrandCampaign }) {
  const st = CAMPAIGN_STATUS[c.status] ?? CAMPAIGN_STATUS.closed;
  return (
    <Row
      title={c.title}
      meta={`${PLATFORM_LABELS[c.platform]} · Started ${formatDate(c.createdAt)} · ${c.creators.length} ${c.creators.length === 1 ? "creator" : "creators"}`}
      status={st.label}
      statusTone={st.tone}
      figure={c.totalViews.toLocaleString()}
      figureLabel="Views"
      detailsLabel="Creators"
      details={
        c.creators.length === 0 ? (
          <p className="text-sm text-muted-foreground">No creators on this campaign yet.</p>
        ) : (
          <ul className="divide-y divide-border/70">
            {c.creators.map((cr) => {
              const cs = CREATOR_STATUS[cr.status] ?? CREATOR_STATUS.active;
              return (
                <li key={cr.assignmentId} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
                  <Initial name={cr.name} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-[15px] font-semibold text-foreground">{cr.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {PLATFORM_LABELS[cr.platform]} @{cr.handle}
                      {cr.proofUrl && (
                        <>
                          {" · "}
                          <a
                            href={cr.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary underline underline-offset-2"
                          >
                            View post
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <StatusBadge tone={cs.tone}>{cs.label}</StatusBadge>
                  <p className="min-w-20 text-right tabular-nums text-[15px] font-semibold text-foreground">
                    {cr.views.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">views</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )
      }
    />
  );
}
