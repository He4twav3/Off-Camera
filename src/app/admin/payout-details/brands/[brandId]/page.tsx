import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayments } from "@/lib/admin-payments";
import { EmailDraft } from "@/components/admin/email-draft";
import { brandEmail } from "@/lib/payment-emails";
import { siteConfig } from "@/lib/site-config";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Brand payout · Admin" };

// One brand: a single email covering everything it owes, each creator with their amount and payment link.
export default async function AdminBrandPayoutPage(props: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await props.params;
  const { payments, brands } = await getPayments();
  const brand = brands.get(brandId);
  const mine = payments.filter((p) => p.brandId === brandId);
  if (!brand && mine.length === 0) notFound();
  const name = brand?.company ?? mine[0]?.brandName ?? "Brand";
  const total = mine.reduce((n, p) => n + p.amount, 0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/admin/payout-details?side=brands" className="text-sm text-muted-foreground hover:text-foreground">
        ← Payout details
      </Link>
      <header className="mb-5 mt-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {brand?.email ?? "No email on file"} · owes {formatCurrency(total)}
        </p>
      </header>

      {mine.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          This brand owes nothing right now. A payment appears here once one is issued in{" "}
          <Link href="/admin/statements" className="text-primary hover:underline">
            Payments
          </Link>
          .
        </p>
      ) : (
        <EmailDraft
          title="Email to the brand"
          initial={brandEmail({
            to: brand?.email ?? "",
            contactName: brand?.contactName ?? "",
            dashboardUrl: `${siteConfig.url}/brand/payments`,
            items: mine.map((p) => ({ creatorName: p.creator.name, campaign: p.campaignTitle, amount: p.amount, dueAt: p.dueAt, payTo: p.creator.payTo })),
          })}
          kind="brand"
          ids={mine.map((p) => p.statementId)}
          sent={mine.every((p) => p.brandSent) ? (mine[0].brandSent ?? null) : null}
        />
      )}
    </div>
  );
}
