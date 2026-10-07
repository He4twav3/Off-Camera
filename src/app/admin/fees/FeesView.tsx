import { PageShell, PageHeader, Stat, StatGrid, Tabs, RowList, Row, Initial, EmptyState, Facts } from "@/components/kit/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { feeStatus, groupFees, invoiceText, money, totalsOf, type BrandFees, type FeeRow } from "@/lib/fees";
import { toggleFeeReceivedAction } from "@/app/admin/statements/actions";
import { CopyInvoice } from "./CopyInvoice";

const TABS = ["owed", "received", "all"] as const;
type Tab = (typeof TABS)[number];

/**
 * What each brand owes us, per campaign and per creator. A fee exists once a statement
 * is issued; you tick it as received when the brand's payment arrives.
 */
export function FeesView({ rows, tab }: { rows: FeeRow[]; tab?: string }) {
  const active: Tab = (TABS as readonly string[]).includes(tab ?? "") ? (tab as Tab) : "owed";

  const all = totalsOf(rows);
  const brandsOwing = groupFees(rows).filter((b) => b.totals.outstanding > 0).length;

  const shown = rows.filter((r) => {
    const s = feeStatus(r);
    if (active === "received") return s === "received";
    if (active === "owed") return s === "outstanding" || s === "unset";
    return true;
  });
  const brands = groupFees(shown);

  // Invoices always cover everything still owed by the brand, whichever tab is open.
  const owedByBrand = new Map(groupFees(rows).map((b) => [b.key, b]));

  const count = (f: (r: FeeRow) => boolean) => rows.filter(f).length;
  const tabs = [
    { key: "owed", label: "To collect", count: count((r) => feeStatus(r) !== "received"), href: "/admin/fees", attention: true },
    { key: "received", label: "Received", count: count((r) => feeStatus(r) === "received"), href: "/admin/fees?tab=received" },
    { key: "all", label: "All", count: rows.length, href: "/admin/fees?tab=all" },
  ];

  return (
    <PageShell>
      <PageHeader title="Fees" summary="What each brand owes us, for each creator in each campaign." />

      <StatGrid>
        <Stat label="To collect" value={money(all.outstanding)} attention={all.outstanding > 0} hint={`${brandsOwing} ${brandsOwing === 1 ? "brand" : "brands"}`} />
        <Stat label="Received" value={money(all.received)} />
        <Stat label="Total fees" value={money(all.fee)} hint={`${all.creators} ${all.creators === 1 ? "creator" : "creators"}`} />
        <Stat label="No fee set" value={String(all.unset)} attention={all.unset > 0} hint="Statements with a $0 fee" />
      </StatGrid>

      <Tabs items={tabs} active={active} />

      {brands.length === 0 ? (
        <EmptyState
          title={active === "received" ? "No fees received yet" : "Nothing to collect"}
          body="A fee appears here when you issue a statement with a fee on it."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {brands.map((b) => (
            <BrandBlock key={b.key} brand={b} invoice={owedByBrand.get(b.key) ?? b} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function BrandBlock({ brand, invoice }: { brand: BrandFees; invoice: BrandFees }) {
  const owed = invoice.totals.outstanding;
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">{brand.brand}</h2>
          <p className="text-sm text-muted-foreground">
            {money(owed)} to collect · {money(invoice.totals.received)} received · {brand.campaigns.length}{" "}
            {brand.campaigns.length === 1 ? "campaign" : "campaigns"}
          </p>
        </div>
        {owed > 0 && <CopyInvoice text={invoiceText(invoice)} />}
      </div>

      <div className="flex flex-col gap-5">
        {brand.campaigns.map((c) => (
          <div key={c.jobId}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
              <h3 className="text-[15px] font-semibold text-foreground">{c.campaign}</h3>
              <p className="text-sm text-muted-foreground">
                Campaign owes us <span className="font-semibold text-foreground">{money(c.totals.outstanding)}</span>
                {c.totals.received > 0 && ` · ${money(c.totals.received)} received`}
              </p>
            </div>
            <RowList>
              {c.rows.map((r) => (
                <FeeRowItem key={r.id} row={r} />
              ))}
            </RowList>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeeRowItem({ row: r }: { row: FeeRow }) {
  const status = feeStatus(r);
  return (
    <Row
      leading={<Initial name={r.creator} />}
      title={r.creator}
      meta={`@${r.handle} · brand pays creator ${money(r.amount)}`}
      status={status === "received" ? "Received" : status === "unset" ? "No fee set" : "Not received"}
      statusTone={status === "received" ? "success" : status === "unset" ? "error" : "pending"}
      figure={money(r.fee)}
      figureLabel="Fee owed to us"
      detailsLabel="Details"
      details={
        <div className="flex flex-col gap-4">
          <Facts
            items={[
              { label: "Statement issued", value: formatDate(r.issuedAt) },
              { label: "Due", value: formatDate(r.dueAt) },
              { label: "Brand owes the creator", value: money(r.amount) },
              { label: "Fee owed to us", value: status === "unset" ? "None set" : money(r.fee) },
              { label: "Fee received", value: r.feeReceivedAt ? formatDate(r.feeReceivedAt) : "Not yet" },
            ]}
          />
          {status !== "unset" && (
            <form action={toggleFeeReceivedAction} className="self-start">
              <input type="hidden" name="id" value={r.id} />
              <Button type="submit" variant="outline" size="sm">
                {r.feeReceivedAt ? "Mark as not received" : "Mark fee as received"}
              </Button>
            </form>
          )}
        </div>
      }
    />
  );
}
