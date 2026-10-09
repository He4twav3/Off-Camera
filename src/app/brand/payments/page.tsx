import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState, PageHeader, PageShell, RowList, Stat, StatGrid } from "@/components/kit/ui";
import { statementState } from "@/lib/direct-pay";
import { getBrandStatements } from "@/lib/direct-pay-data";
import { formatCurrency } from "@/lib/utils";
import { loadBrandPage } from "../_brand";
import { PendingNotice } from "../PendingNotice";
import { PaymentRow } from "../BrandParts";
import { HowYouPay } from "../HowYouPay";

export const metadata: Metadata = { title: "Payments" };

export default async function BrandPaymentsPage(props: { searchParams: Promise<{ archive?: string }> }) {
  const { archive } = await props.searchParams;
  const showArchive = archive === "1";
  const { brand, ws, approved } = await loadBrandPage("/brand/payments");
  if (!approved)
    return (
      <PageShell>
        <PageHeader title="Payments" />
        <PendingNotice status={brand.status} />
      </PageShell>
    );

  const statements = await getBrandStatements(brand.id);
  const open = statements.filter((s) => statementState(s) !== "confirmed");
  const done = statements.filter((s) => statementState(s) === "confirmed");
  const paid = ws.creators.reduce((n, c) => n + c.paid, 0);
  const toPay = open.filter((s) => !s.brand_paid_at && !s.creator_confirmed_at).reduce((n, s) => n + s.amount, 0);

  if (showArchive)
    return (
      <PageShell>
        <Link href="/brand/payments" className="text-sm text-muted-foreground hover:text-foreground">
          ← Payments
        </Link>
        <div className="mt-3">
          <PageHeader title="Archive" summary="Payments the creator has confirmed receiving." />
        </div>
        {done.length === 0 ? (
          <EmptyState title="Nothing archived yet" body="Confirmed payments are kept here." />
        ) : (
          <RowList>
            {done.map((s) => (
              <PaymentRow key={s.id} s={s} />
            ))}
          </RowList>
        )}
      </PageShell>
    );

  return (
    <PageShell>
      <PageHeader title="Payments" summary="What you owe each creator. Pay through their link, then mark it paid." />
      <StatGrid>
        <Stat label="To pay now" value={formatCurrency(toPay)} attention={toPay > 0} hint={open.length ? `${open.length} ${open.length === 1 ? "payment" : "payments"} open` : "All paid"} />
        <Stat label="Paid so far" value={formatCurrency(paid)} />
      </StatGrid>

      <div className="mb-6">
        <HowYouPay />
      </div>

      {open.length === 0 ? (
        <EmptyState title="Nothing to pay" body="When a payment is due, it appears here with the creator's payment link." />
      ) : (
        <RowList>
          {open.map((s) => (
            <PaymentRow key={s.id} s={s} />
          ))}
        </RowList>
      )}

      <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
        <Link href="/brand/payments?archive=1" className="inline-flex items-center gap-1 hover:text-foreground">
          Archive ({done.length})
          <ChevronRight className="size-3" />
        </Link>
        {statements.length > 0 && (
          <a href="/brand/payments/export" className="hover:text-foreground">
            Download as spreadsheet (CSV)
          </a>
        )}
      </div>
    </PageShell>
  );
}
