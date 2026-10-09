import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Body, Head, SectionTitle, Table, Td, Th } from "@/components/admin/table";
import { CopyButton } from "@/components/admin/copy-button";
import { PayoutCell } from "@/components/admin/payout-cell";
import { CreatorDetail } from "@/components/admin/creator-detail";
import type { AdminWorkspace } from "@/lib/admin-workspace";
import { PLATFORM_LABELS, formatCurrency } from "@/lib/utils";

const STATUS = { open: "Open", filled: "Filled", closed: "Closed" } as const;

/**
 * The admin home: the picture of the work, in one order. Each CAMPAIGN opens to show the CREATORS on it;
 * each creator opens to show their social accounts, videos and views, and the money (what they earned,
 * what was paid, MY EARNINGS). Then the PAYOUTS: every creator's email and payment link.
 * What is waiting on you is the numbers beside the menu items.
 */
export function OverviewView({ ws }: { ws: AdminWorkspace }) {
  const people = new Map<string, AdminWorkspace["creators"]>();
  for (const c of ws.creators) people.set(c.applicantId, [...(people.get(c.applicantId) ?? []), c]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-2">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Overview</h1>
      </header>

      <SectionTitle aside={<Link href="/admin/jobs" className="text-sm font-medium text-primary hover:underline">All campaigns</Link>}>
        Campaigns
      </SectionTitle>
      {ws.campaigns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">No campaigns yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {ws.campaigns.map((c) => (
            <details key={c.id} className="group overflow-hidden rounded-xl border border-border/70 bg-card" open={ws.campaigns.length === 1}>
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                <span className="font-heading text-base font-semibold text-foreground">{c.title}</span>
                <StatusBadge tone={c.status === "open" ? "open" : "closed"}>{STATUS[c.status]}</StatusBadge>
                <span className="text-xs text-muted-foreground">
                  {c.brandName ?? "No brand yet"} · {PLATFORM_LABELS[c.platform as keyof typeof PLATFORM_LABELS] ?? c.platform} · {c.creators.length}{" "}
                  {c.creators.length === 1 ? "creator" : "creators"}
                </span>
                <span className="ml-auto flex flex-wrap gap-x-5 text-xs tabular-nums text-muted-foreground">
                  <span>{c.views.toLocaleString()} views</span>
                  <span>{formatCurrency(c.earned)} earned</span>
                  <span>brand owes {formatCurrency(Math.max(0, c.statemented - c.paid))}</span>
                  <span className="font-medium text-foreground">my earnings {formatCurrency(c.ourFees)}</span>
                </span>
              </summary>

              <div className="border-t border-border/70">
                {c.creators.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Nobody has joined yet.</p>
                ) : (
                  <div className="divide-y divide-border/50">
                    <div className="hidden grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] gap-3 px-4 py-2 pl-11 text-xs text-muted-foreground md:grid">
                      <span>Creator</span>
                      <span className="text-right">Videos</span>
                      <span className="text-right">Views</span>
                      <span className="text-right">Earned</span>
                      <span className="text-right">My earnings</span>
                      <span className="text-right">Paid</span>
                    </div>
                    {[...c.creators].sort((a, b) => b.views - a.views).map((cr) => (
                      <details key={cr.assignmentId} className="group/cr">
                        <summary className="grid cursor-pointer list-none grid-cols-2 items-center gap-x-3 gap-y-1 px-4 py-2 text-sm hover:bg-muted/30 md:grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] [&::-webkit-details-marker]:hidden">
                          <span className="col-span-2 flex items-center gap-2 md:col-span-1">
                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open/cr:rotate-90" />
                            <span className="font-medium text-foreground">{cr.name}</span>
                            <span className="text-xs text-muted-foreground">@{cr.handle}</span>
                          </span>
                          <span className="tabular-nums md:text-right"><span className="text-muted-foreground md:hidden">Videos </span>{cr.videos}</span>
                          <span className="tabular-nums md:text-right"><span className="text-muted-foreground md:hidden">Views </span>{cr.views.toLocaleString()}</span>
                          <span className="tabular-nums md:text-right"><span className="text-muted-foreground md:hidden">Earned </span>{formatCurrency(cr.earned)}</span>
                          <span className="tabular-nums md:text-right"><span className="text-muted-foreground md:hidden">Mine </span>{formatCurrency(cr.ourFees)}</span>
                          <span className="tabular-nums md:text-right"><span className="text-muted-foreground md:hidden">Paid </span>{formatCurrency(cr.paid)}</span>
                        </summary>
                        <div className="border-t border-border/40 bg-muted/20 pl-7">
                          <CreatorDetail cr={cr} />
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </details>
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
