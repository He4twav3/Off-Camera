import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Body, Figures, Head, SectionTitle, Table, Td, Th } from "@/components/admin/table";
import { CopyButton } from "@/components/admin/copy-button";
import { PayoutCell } from "@/components/admin/payout-cell";
import type { AdminWorkspace } from "@/lib/admin-workspace";
import { PLATFORM_LABELS, formatCurrency } from "@/lib/utils";

export type QueueItem = {
  label: string;
  value: string;
  href: string;
  /** Something is waiting on you. */
  urgent: boolean;
};

const STATUS = { open: "Open", filled: "Filled", closed: "Closed" } as const;

/**
 * The admin home, in one order: what needs you, then each CAMPAIGN with the CREATORS on it, their VIEWS
 * and EARNINGS, and MY EARNINGS (our fee); then the PAYOUTS: every creator's email and payment link.
 * Everything links down to the campaign page and the creator page.
 */
export function OverviewView({ summary, queue, ws }: { summary: string; queue: QueueItem[]; ws: AdminWorkspace }) {
  const waiting = queue.filter((q) => q.urgent);
  const quiet = queue.filter((q) => !q.urgent);
  const total = (f: (c: AdminWorkspace["campaigns"][number]) => number) => ws.campaigns.reduce((n, c) => n + f(c), 0);
  const paid = total((c) => c.paid);
  const owed = Math.max(0, total((c) => c.statemented) - paid);
  const people = new Map<string, AdminWorkspace["creators"]>();
  for (const c of ws.creators) people.set(c.applicantId, [...(people.get(c.applicantId) ?? []), c]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-4">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
      </header>

      <section aria-labelledby="needs-you" className="mb-5">
        <h2 id="needs-you" className="sr-only">
          Needs you
        </h2>
        {waiting.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {waiting.map((q) => (
              <li key={q.label}>
                <Link
                  href={q.href}
                  className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-primary/15"
                >
                  <span className="rounded bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">{q.value}</span>
                  {q.label}
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing is waiting on you.</p>
        )}
        {quiet.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Clear:{" "}
            {quiet.map((q, i) => (
              <span key={q.label}>
                {i > 0 && " · "}
                <Link href={q.href} className="hover:text-foreground hover:underline">
                  {q.label}
                </Link>
              </span>
            ))}
          </p>
        )}
      </section>

      <Figures
        items={[
          { label: "Views", value: total((c) => c.views).toLocaleString() },
          { label: "Videos", value: total((c) => c.videos).toLocaleString() },
          { label: "Creators", value: String(people.size) },
          { label: "Creators earned", value: formatCurrency(total((c) => c.earned)) },
          { label: "Brands owe", value: formatCurrency(owed), attention: owed > 0 },
          { label: "Paid out", value: formatCurrency(paid) },
          { label: "My earnings", value: formatCurrency(total((c) => c.ourFees)), hint: `${formatCurrency(total((c) => c.feesOutstanding))} not received`, attention: total((c) => c.feesOutstanding) > 0 },
        ]}
      />

      <SectionTitle aside={<Link href="/admin/jobs" className="text-sm font-medium text-primary hover:underline">All campaigns</Link>}>
        Campaigns and their creators
      </SectionTitle>
      {ws.campaigns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">No campaigns yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {ws.campaigns.map((c) => (
            <section key={c.id} className="overflow-hidden rounded-xl border border-border/70 bg-card">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border/70 bg-muted/30 px-4 py-2.5">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  <Link href={`/admin/jobs/${c.id}`} className="hover:underline">
                    {c.title}
                  </Link>
                </h3>
                <StatusBadge tone={c.status === "open" ? "open" : "closed"}>{STATUS[c.status]}</StatusBadge>
                <span className="text-xs text-muted-foreground">
                  {c.brandName ?? "No brand yet"} · {PLATFORM_LABELS[c.platform as keyof typeof PLATFORM_LABELS] ?? c.platform}
                </span>
                <span className="ml-auto flex flex-wrap gap-x-5 text-xs tabular-nums text-muted-foreground">
                  <span>{c.views.toLocaleString()} views</span>
                  <span>{formatCurrency(c.earned)} earned</span>
                  <span>brand owes {formatCurrency(Math.max(0, c.statemented - c.paid))}</span>
                  <span className="font-medium text-foreground">my earnings {formatCurrency(c.ourFees)}</span>
                </span>
              </div>
              {c.creators.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Nobody has joined yet.</p>
              ) : (
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <Th>Creator</Th>
                      <Th right>Videos</Th>
                      <Th right>Views</Th>
                      <Th right>Earned</Th>
                      <Th right>My earnings</Th>
                      <Th right>Paid</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[...c.creators].sort((a, b) => b.views - a.views).map((cr) => (
                      <tr key={cr.assignmentId} className="hover:bg-muted/30">
                        <Td className="py-1.5">
                          <Link href={`/admin/jobs/${c.id}/creators/${cr.assignmentId}`} className="font-medium text-foreground hover:underline">
                            {cr.name}
                          </Link>
                          <span className="ml-2 text-xs text-muted-foreground">@{cr.handle}</span>
                        </Td>
                        <Td right className="py-1.5">{cr.videos}</Td>
                        <Td right className="py-1.5">{cr.views.toLocaleString()}</Td>
                        <Td right className="py-1.5">{formatCurrency(cr.earned)}</Td>
                        <Td right className="py-1.5">{formatCurrency(cr.ourFees)}</Td>
                        <Td right className="py-1.5">{formatCurrency(cr.paid)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>
      )}

      <SectionTitle aside={<Link href="/admin/payout-details" className="text-sm font-medium text-primary hover:underline">Payout details</Link>}>
        Payouts: emails and payment links
      </SectionTitle>
      {people.size === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">No creators yet.</p>
      ) : (
        <Table min="46rem">
          <Head>
            <Th>Creator</Th>
            <Th>Email</Th>
            <Th>Payment link</Th>
            <Th right>Still owed</Th>
          </Head>
          <Body>
            {[...people.values()].map((rows) => {
              const p = rows[0];
              const still = Math.max(0, rows.reduce((n, r) => n + r.statemented, 0) - rows.reduce((n, r) => n + r.paid, 0));
              return (
                <tr key={p.applicantId} className="hover:bg-muted/30">
                  <Td className="py-1.5">
                    <span className="font-medium text-foreground">{p.name}</span>
                  </Td>
                  <Td className="py-1.5">
                    <span className="flex flex-wrap items-center gap-x-3">
                      <span className="text-foreground">{p.email}</span>
                      <CopyButton value={p.email} />
                    </span>
                  </Td>
                  <Td className="py-1.5">
                    <PayoutCell payout={p.payout} />
                  </Td>
                  <Td right className="py-1.5">{formatCurrency(still)}</Td>
                </tr>
              );
            })}
          </Body>
        </Table>
      )}
    </div>
  );
}
