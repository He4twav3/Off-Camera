import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadAdminWorkspace, type ACreator } from "@/lib/admin-workspace";
import { Body, Head, Table, Td, Th } from "@/components/admin/table";
import { CopyButton } from "@/components/admin/copy-button";
import { PayoutCell } from "@/components/admin/payout-cell";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Payout details · Admin" };

type Person = { applicantId: string; name: string; email: string; handle: string; payout: ACreator["payout"]; rows: ACreator[] };

export default async function AdminPayoutDetailsPage(props: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await props.searchParams;
  const ws = await loadAdminWorkspace(await createClient());

  // One row per creator, across every campaign they are on.
  const byPerson = new Map<string, Person>();
  for (const c of ws.creators) {
    const cur = byPerson.get(c.applicantId);
    if (cur) cur.rows.push(c);
    else byPerson.set(c.applicantId, { applicantId: c.applicantId, name: c.name, email: c.email, handle: c.handle, payout: c.payout, rows: [c] });
  }
  const needle = (q ?? "").trim().toLowerCase();
  const people = [...byPerson.values()]
    .filter((p) => !needle || `${p.name} ${p.email} ${p.handle}`.toLowerCase().includes(needle))
    .sort((a, b) => Number(Boolean(b.payout.raw)) - Number(Boolean(a.payout.raw)) || a.name.localeCompare(b.name));
  const missing = [...byPerson.values()].filter((p) => !p.payout.raw).length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Payout details</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Where each creator gets paid: their email and their Stripe or Wise payment link. Open or copy them here when a statement needs
          sorting out. {missing > 0 ? `${missing} ${missing === 1 ? "creator hasn't" : "creators haven't"} added a payment link yet.` : "Every creator has added one."}
        </p>
      </header>

      <form className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, email or @handle"
          className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm"
          aria-label="Search creators"
        />
      </form>

      {people.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          No creators to show.
        </p>
      ) : (
        <Table min="58rem">
          <Head>
            <Th>Creator</Th>
            <Th>Email</Th>
            <Th>Payment link</Th>
            <Th>Campaigns</Th>
            <Th right>Earned</Th>
            <Th right>Paid</Th>
            <Th right>Still owed</Th>
          </Head>
          <Body>
            {people.map((p) => {
              const earned = p.rows.reduce((n, r) => n + r.earned, 0);
              const paid = p.rows.reduce((n, r) => n + r.paid, 0);
              const owed = Math.max(0, p.rows.reduce((n, r) => n + r.statemented, 0) - paid);
              return (
                <tr key={p.applicantId} className="hover:bg-muted/30">
                  <Td>
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">@{p.handle}</span>
                  </Td>
                  <Td>
                    <span className="flex flex-wrap items-center gap-x-3">
                      <span className="text-foreground">{p.email}</span>
                      <CopyButton value={p.email} />
                    </span>
                  </Td>
                  <Td>
                    <PayoutCell payout={p.payout} />
                  </Td>
                  <Td>
                    <span className="flex flex-col gap-0.5">
                      {p.rows.map((r) => (
                        <Link key={r.assignmentId} href={`/admin/jobs/${r.campaignId}/creators/${r.assignmentId}`} className="text-primary hover:underline">
                          {r.campaignTitle}
                        </Link>
                      ))}
                    </span>
                  </Td>
                  <Td right>{formatCurrency(earned)}</Td>
                  <Td right>{formatCurrency(paid)}</Td>
                  <Td right>{formatCurrency(owed)}</Td>
                </tr>
              );
            })}
          </Body>
        </Table>
      )}
    </div>
  );
}
