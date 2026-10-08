import { Download, FileText } from "lucide-react";
import { PAYMENT_PROVIDERS, providerOfLink } from "@/lib/payment-links";
import type { StatusTone } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { statementState, type StatementState } from "@/lib/direct-pay";
import type { BrandStatement } from "@/lib/direct-pay-data";
import { Facts, Initial, Row } from "@/components/kit/ui";
import { PayCreatorForm } from "./PayCreatorForm";

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

export function PaymentRow({ s }: { s: BrandStatement }) {
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
                value:
                  state === "confirmed" ? (
                    "—"
                  ) : providerOfLink(s.payTo) ? (
                    <span>
                      <a
                        href={s.payTo!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary underline underline-offset-2"
                      >
                        Pay with {PAYMENT_PROVIDERS[providerOfLink(s.payTo)!].label}
                      </a>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Enter exactly {formatCurrency(s.amount)}.
                      </span>
                    </span>
                  ) : (
                    (s.payTo ??
                    "The creator hasn't added payment details yet. We've asked them to.")
                  ),
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

// Templates a brand can download and fill in. Plain files in /public/downloads.
const BRAND_TEMPLATES = [
  {
    label: "UGC creator agreement",
    note: "Per-post pay, bonuses, usage rights and disclosure. Have a lawyer review it.",
    href: "/downloads/ugc-creator-agreement.txt",
  },
  {
    label: "Campaign brief template",
    note: "The brief creators see before they join.",
    href: "/downloads/campaign-brief-template.txt",
  },
];

export function BrandResources() {
  return (
    <section className="mt-8 rounded-xl border border-border/70 bg-card p-5">
      <h2 className="font-heading text-base font-semibold text-foreground">
        Templates
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Starting points for working with creators. They are not legal advice.
      </p>
      <ul className="mt-3 divide-y divide-border/70">
        {BRAND_TEMPLATES.map((t) => (
          <li key={t.href}>
            <a
              href={t.href}
              download
              className="flex items-center gap-3 py-3 text-sm hover:text-foreground"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">
                  {t.label}
                </span>
                <span className="block text-muted-foreground">{t.note}</span>
              </span>
              <Download className="size-4 shrink-0 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
