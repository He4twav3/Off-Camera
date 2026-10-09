import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { getPayments } from "@/lib/admin-payments";
import { EmailDraft } from "@/components/admin/email-draft";
import { CopyButton } from "@/components/admin/copy-button";
import { PayoutCell } from "@/components/admin/payout-cell";
import { SectionTitle } from "@/components/admin/table";
import { brandEmail, creatorEmail } from "@/lib/payment-emails";
import { siteConfig } from "@/lib/site-config";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Creator payout · Admin" };

// One creator: their email and payment link, then each payment that is waiting with its two emails written.
export default async function AdminCreatorPayoutPage(props: { params: Promise<{ applicantId: string }> }) {
  const { applicantId } = await props.params;
  const [ws, { payments, brands }] = await Promise.all([getAdminWorkspace(), getPayments()]);
  const me = ws.creators.find((c) => c.applicantId === applicantId);
  if (!me) notFound();
  const mine = payments.filter((p) => p.creator.applicantId === applicantId);
  const base = siteConfig.url;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/admin/payout-details" className="text-sm text-muted-foreground hover:text-foreground">
        ← Payout details
      </Link>
      <header className="mb-5 mt-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{me.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
          {me.email}
          <CopyButton value={me.email} />
        </p>
        <div className="mt-1.5 text-sm">
          <PayoutCell payout={me.payout} />
        </div>
      </header>

      {mine.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Nothing to send. A payment appears here once one is issued in{" "}
          <Link href="/admin/statements" className="text-primary hover:underline">
            Payments
          </Link>
          .
        </p>
      ) : (
        mine.map((p) => {
          const brand = p.brandId ? brands.get(p.brandId) : undefined;
          const item = { creatorName: p.creator.name, campaign: p.campaignTitle, amount: p.amount, dueAt: p.dueAt, payTo: p.creator.payTo };
          return (
            <div key={p.statementId} className="mb-8">
              <SectionTitle>
                {p.campaignTitle}: {formatCurrency(p.amount)}
              </SectionTitle>
              <div className="flex flex-col gap-4">
                <EmailDraft
                  title={`Email to the brand${p.brandName ? ` (${p.brandName})` : ""}`}
                  initial={brandEmail({
                    to: brand?.email ?? "",
                    contactName: brand?.contactName ?? "",
                    dashboardUrl: `${base}/brand/payments`,
                    items: [item],
                  })}
                  kind="brand"
                  ids={[p.statementId]}
                  sent={p.brandSent}
                />
                <EmailDraft
                  title="Email to the creator"
                  initial={creatorEmail({
                    to: p.creator.email,
                    creatorName: p.creator.name,
                    brandName: p.brandName,
                    item,
                    earningsUrl: `${base}/dashboard/recruiting/earnings`,
                    hasLink: Boolean(p.creator.payTo),
                  })}
                  kind="creator"
                  ids={[p.statementId]}
                  sent={p.creatorSent}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
