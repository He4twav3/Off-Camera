import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Body, Head, Table, Td, Th } from "@/components/admin/table";
import { CopyButton } from "@/components/admin/copy-button";
import { PayoutCell } from "@/components/admin/payout-cell";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { getPayments } from "@/lib/admin-payments";
import { cn, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Payout details · Admin" };

const ToSend = ({ n }: { n: number }) =>
  n > 0 ? (
    <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary-foreground">{n} to send</span>
  ) : (
    <span className="text-xs text-muted-foreground">Nothing to send</span>
  );

// Two sides: creators and brands. Click one to get the emails, already written, with the amounts and links filled in.
export default async function AdminPayoutDetailsPage(props: { searchParams: Promise<{ side?: string; q?: string }> }) {
  const { side, q } = await props.searchParams;
  const brandsSide = side === "brands";
  const [ws, { payments, brands }, supabase] = await Promise.all([getAdminWorkspace(), getPayments(), createClient()]);
  const needle = (q ?? "").trim().toLowerCase();

  // Creators: everyone on a campaign.
  const byCreator = new Map<string, (typeof ws.creators)[number]>();
  for (const c of ws.creators) if (!byCreator.has(c.applicantId)) byCreator.set(c.applicantId, c);
  const creators = [...byCreator.values()]
    .filter((c) => !needle || `${c.name} ${c.email}`.toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Brands: every approved brand, with what it owes.
  const { data: allBrands } = await supabase.from("brand_accounts").select("id, company_name").eq("status", "approved").order("company_name");
  const brandRows = (allBrands ?? []).filter((b) => !needle || b.company_name.toLowerCase().includes(needle));

  const tab = (label: string, href: string, on: boolean) => (
    <Link
      href={href}
      className={cn(
        "rounded-md border px-4 py-1.5 text-sm font-medium",
        on ? "border-primary/40 bg-primary/10 text-foreground" : "border-border/70 text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-4">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Payout details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a creator or a brand for the emails to send, already written. Edit if needed, send, then mark as sent.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tab("Creators", "/admin/payout-details", !brandsSide)}
        {tab("Brands", "/admin/payout-details?side=brands", brandsSide)}
        <form className="ml-auto">
          {brandsSide && <input type="hidden" name="side" value="brands" />}
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search"
            aria-label="Search"
            className="w-56 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          />
        </form>
      </div>

      {brandsSide ? (
        brandRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">No brands.</p>
        ) : (
          <Table min="40rem">
            <Head>
              <Th>Brand</Th>
              <Th>Contact</Th>
              <Th right>Owes</Th>
              <Th>Emails</Th>
              <Th />
            </Head>
            <Body>
              {brandRows.map((b) => {
                const mine = payments.filter((p) => p.brandId === b.id);
                const owes = mine.reduce((n, p) => n + p.amount, 0);
                const unsent = mine.filter((p) => !p.brandSent).length;
                const contact = brands.get(b.id);
                return (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <Td className="py-2">
                      <Link href={`/admin/payout-details/brands/${b.id}`} className="font-medium text-foreground hover:underline">
                        {b.company_name}
                      </Link>
                    </Td>
                    <Td muted>{contact?.email ?? "-"}</Td>
                    <Td right>{formatCurrency(owes)}</Td>
                    <Td>
                      <ToSend n={unsent} />
                    </Td>
                    <Td right>
                      <Link href={`/admin/payout-details/brands/${b.id}`} aria-label={`Open ${b.company_name}`}>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </Body>
          </Table>
        )
      ) : creators.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">No creators.</p>
      ) : (
        <Table min="50rem">
          <Head>
            <Th>Creator</Th>
            <Th>Email</Th>
            <Th>Payment link</Th>
            <Th>Emails</Th>
            <Th />
          </Head>
          <Body>
            {creators.map((c) => {
              const mine = payments.filter((p) => p.creator.applicantId === c.applicantId);
              const unsent = mine.filter((p) => !p.brandSent).length + mine.filter((p) => !p.creatorSent).length;
              return (
                <tr key={c.applicantId} className="hover:bg-muted/30">
                  <Td className="py-2">
                    <Link href={`/admin/payout-details/creators/${c.applicantId}`} className="font-medium text-foreground hover:underline">
                      {c.name}
                    </Link>
                  </Td>
                  <Td>
                    <span className="flex flex-wrap items-center gap-x-3">
                      <span className="text-foreground">{c.email}</span>
                      <CopyButton value={c.email} />
                    </span>
                  </Td>
                  <Td>
                    <PayoutCell payout={c.payout} />
                  </Td>
                  <Td>
                    <ToSend n={unsent} />
                  </Td>
                  <Td right>
                    <Link href={`/admin/payout-details/creators/${c.applicantId}`} aria-label={`Open ${c.name}`}>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </Body>
        </Table>
      )}
    </div>
  );
}
