import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState, Notice, PageHeader, PageShell, RowList, Stat, StatGrid } from "@/components/kit/ui";
import { statementState } from "@/lib/direct-pay";
import { getBrandStatements } from "@/lib/direct-pay-data";
import { formatCurrency } from "@/lib/utils";
import { loadBrandPage } from "../_brand";
import { PendingNotice } from "../PendingNotice";
import { PaymentRow } from "../BrandParts";

export const metadata: Metadata = { title: "Payments" };

export default async function BrandPaymentsPage() {
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
  const earned = ws.creators.reduce((n, c) => n + c.earned, 0);
  const paid = ws.creators.reduce((n, c) => n + c.paid, 0);
  const toPay = open.filter((s) => !s.brand_paid_at && !s.creator_confirmed_at).reduce((n, s) => n + s.amount, 0);
  const rows = [...ws.creators].filter((c) => c.earned > 0 || c.paid > 0).sort((a, b) => b.earned - a.earned);

  return (
    <PageShell>
      <PageHeader title="Payments" summary="What each creator has earned, what is due, and what you have paid." />
      <StatGrid>
        <Stat label="Earned by creators" value={formatCurrency(earned)} />
        <Stat label="Paid" value={formatCurrency(paid)} />
        <Stat label="To pay now" value={formatCurrency(toPay)} attention={toPay > 0} hint={open.length ? `${open.length} ${open.length === 1 ? "statement" : "statements"} open` : "All paid"} />
      </StatGrid>

      <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Each creator</h2>
      {rows.length === 0 ? (
        <EmptyState title="Nothing earned yet" body="Creators' earnings appear here as their videos are approved and counted." />
      ) : (
        <div className="mb-8 overflow-x-auto rounded-xl border border-border/70 bg-card">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="border-b border-border/70 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-3 py-3 font-medium">Campaign</th>
                <th className="px-3 py-3 text-right font-medium">Earned</th>
                <th className="px-3 py-3 text-right font-medium">Due now</th>
                <th className="px-3 py-3 text-right font-medium">Paid</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {rows.map((c) => (
                <tr key={c.assignmentId}>
                  <td className="px-4 py-3">
                    <Link href={`/brand/creators/${c.assignmentId}`} className="font-medium text-foreground hover:underline">
                      {c.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">@{c.handle}</span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{c.campaignTitle}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(c.earned)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(Math.max(0, c.payable - c.paid))}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(c.paid)}</td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/brand/creators/${c.assignmentId}`} aria-label={`Open ${c.name}`}>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Statements</h2>
      {statements.length === 0 ? (
        <EmptyState title="No statements yet" body="When a payment is due, it appears here with the creator's payment link." />
      ) : (
        <div className="flex flex-col gap-4">
          <Notice>
            You pay each creator directly through their payment link, from your own account. Send the full amount in US
            dollars and cover any fees so they receive all of it. Then mark it as paid so they can confirm.
          </Notice>
          <RowList>
            {[...open, ...done].map((s) => (
              <PaymentRow key={s.id} s={s} />
            ))}
          </RowList>
        </div>
      )}
    </PageShell>
  );
}
