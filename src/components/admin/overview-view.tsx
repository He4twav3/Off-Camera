import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Body, Figures, Head, SectionTitle, Table, Td, Th } from "@/components/admin/table";
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
 * The admin home as a working overview: what needs you (a short list, only what is waiting),
 * the figures that matter, every campaign with its numbers, and the creators ranked. Everything
 * links down: campaign -> creator -> posts and payments.
 */
export function OverviewView({ summary, queue, ws }: { summary: string; queue: QueueItem[]; ws: AdminWorkspace }) {
  const waiting = queue.filter((q) => q.urgent);
  const quiet = queue.filter((q) => !q.urgent);
  const total = (f: (c: AdminWorkspace["campaigns"][number]) => number) => ws.campaigns.reduce((n, c) => n + f(c), 0);
  const earned = total((c) => c.earned);
  const paid = total((c) => c.paid);
  const owed = Math.max(0, total((c) => c.statemented) - paid);
  const ranked = [...ws.creators].sort((a, b) => b.views - a.views).slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Overview</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">{summary}</p>
      </header>

      <section aria-labelledby="needs-you" className="mb-8">
        <h2 id="needs-you" className="mb-2 font-heading text-lg font-semibold text-foreground">
          {waiting.length > 0 ? "Needs you" : "Nothing waiting on you"}
        </h2>
        {waiting.length > 0 && (
          <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card">
            {waiting.map((q) => (
              <li key={q.label}>
                <Link href={q.href} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                  <span className="min-w-8 rounded-md bg-primary px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-primary-foreground">
                    {q.value}
                  </span>
                  <span className="flex-1 text-[15px] font-medium text-foreground">{q.label}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {quiet.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Clear: {quiet.map((q, i) => (
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
          { label: "Total views", value: total((c) => c.views).toLocaleString() },
          { label: "Videos counting", value: total((c) => c.videos).toLocaleString() },
          { label: "Creators", value: new Set(ws.creators.map((c) => c.applicantId)).size.toLocaleString() },
          { label: "Earned by creators", value: formatCurrency(earned) },
          { label: "Brands still owe", value: formatCurrency(owed), attention: owed > 0 },
          { label: "Paid so far", value: formatCurrency(paid) },
          { label: "Our fees outstanding", value: formatCurrency(total((c) => c.feesOutstanding)), attention: total((c) => c.feesOutstanding) > 0 },
        ]}
      />

      <SectionTitle aside={<Link href="/admin/jobs" className="text-sm font-medium text-primary hover:underline">All campaigns</Link>}>
        Campaigns
      </SectionTitle>
      {ws.campaigns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No campaigns yet.
        </p>
      ) : (
        <Table min="52rem">
          <Head>
            <Th>Campaign</Th>
            <Th>Brand</Th>
            <Th>Status</Th>
            <Th right>Creators</Th>
            <Th right>Videos</Th>
            <Th right>Views</Th>
            <Th right>Earned</Th>
            <Th right>Brand owes</Th>
            <Th right>Paid</Th>
          </Head>
          <Body>
            {ws.campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <Td>
                  <Link href={`/admin/jobs/${c.id}`} className="font-medium text-foreground hover:underline">
                    {c.title}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{PLATFORM_LABELS[c.platform as keyof typeof PLATFORM_LABELS] ?? c.platform}</span>
                </Td>
                <Td muted>{c.brandName ?? "No brand yet"}</Td>
                <Td>
                  <StatusBadge tone={c.status === "open" ? "open" : "closed"}>{STATUS[c.status]}</StatusBadge>
                </Td>
                <Td right>{c.creators.length}</Td>
                <Td right>{c.videos}</Td>
                <Td right>{c.views.toLocaleString()}</Td>
                <Td right>{formatCurrency(c.earned)}</Td>
                <Td right>{formatCurrency(Math.max(0, c.statemented - c.paid))}</Td>
                <Td right>{formatCurrency(c.paid)}</Td>
              </tr>
            ))}
          </Body>
        </Table>
      )}

      <SectionTitle aside={<Link href="/admin/payout-details" className="text-sm font-medium text-primary hover:underline">Payout details</Link>}>
        Creators
      </SectionTitle>
      {ranked.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No creators on a campaign yet.
        </p>
      ) : (
        <Table min="52rem">
          <Head>
            <Th>Creator</Th>
            <Th>Campaign</Th>
            <Th right>Videos</Th>
            <Th right>Views</Th>
            <Th right>Earned</Th>
            <Th right>Paid</Th>
            <Th>Payout</Th>
          </Head>
          <Body>
            {ranked.map((c) => (
              <tr key={c.assignmentId} className="hover:bg-muted/30">
                <Td>
                  <Link href={`/admin/jobs/${c.campaignId}/creators/${c.assignmentId}`} className="font-medium text-foreground hover:underline">
                    {c.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{c.email}</span>
                </Td>
                <Td muted>{c.campaignTitle}</Td>
                <Td right>{c.videos}</Td>
                <Td right>{c.views.toLocaleString()}</Td>
                <Td right>{formatCurrency(c.earned)}</Td>
                <Td right>{formatCurrency(c.paid)}</Td>
                <Td muted>{c.payout.provider ?? (c.payout.raw ? "Old format" : "Not added")}</Td>
              </tr>
            ))}
          </Body>
        </Table>
      )}
    </div>
  );
}
