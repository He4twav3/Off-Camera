import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { Body, Head, SectionTitle, Table, Td, Th } from "@/components/admin/table";
import { CopyButton } from "@/components/admin/copy-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { STATE_LABEL } from "@/lib/direct-pay";
import { PLATFORM_RULES } from "@/lib/handles";
import { PLATFORM_LABELS, formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Creator · Admin" };

const label = (p: string) => PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p;

// One creator on one campaign: their verified accounts, their counting videos with views and earnings, and
// the money. Approving videos is on Post review; payment links and emails are on Payout details.
export default async function AdminCreatorPage(props: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { id, assignmentId } = await props.params;
  const ws = await getAdminWorkspace();
  const c = ws.campaigns.find((x) => x.id === id);
  const cr = c?.creators.find((x) => x.assignmentId === assignmentId);
  if (!c || !cr) notFound();
  const verified = cr.accounts.filter((a) => a.verified);
  const videos = cr.posts.filter((p) => p.counted);
  const owed = Math.max(0, cr.statemented - cr.paid);
  // Did this creator tick the brand's contract when they joined? (Recorded once migration 0025 is in.)
  const { data: accepted } = await (
    (await createClient()) as unknown as {
      from: (n: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { accepted_at: string } | null }> } } };
    }
  )
    .from("contract_acceptances")
    .select("accepted_at")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          Campaigns
        </Link>
        {" / "}
        <Link href={`/admin/jobs/${c.id}`} className="hover:text-foreground">
          {c.title}
        </Link>
      </nav>
      <header className="mb-5 mt-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{cr.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            {cr.email}
            <CopyButton value={cr.email} />
          </span>
          {c.terms?.contract && (
            <span>{accepted ? `Agreed to the contract on ${formatDate(accepted.accepted_at)}` : "Contract agreement not recorded"}</span>
          )}
        </p>
      </header>

      <SectionTitle>Verified accounts</SectionTitle>
      {verified.length === 0 ? (
        <p className="text-sm text-muted-foreground">No verified account yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {verified.map((a) => {
            const rule = PLATFORM_RULES[a.platform as keyof typeof PLATFORM_RULES];
            const handle = a.handle.replace(/^@/, "");
            return (
              <li key={`${a.platform}-${a.handle}`}>
                <span className="text-muted-foreground">{rule?.label ?? a.platform} </span>
                <a href={rule ? rule.profileUrl(handle) : "#"} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  @{handle}
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <SectionTitle>Views and money</SectionTitle>
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        {[
          ["Views", cr.views.toLocaleString()],
          ["Earned", formatCurrency(cr.earned)],
          ["Paid", formatCurrency(cr.paid)],
          ["Brand still owes", formatCurrency(owed)],
          ["My earnings", formatCurrency(cr.ourFees)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="font-heading text-xl font-semibold tabular-nums text-foreground">{v}</dd>
          </div>
        ))}
      </dl>

      <SectionTitle>Videos</SectionTitle>
      {videos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No videos are counting yet.</p>
      ) : (
        <Table min="34rem">
          <Head>
            <Th>Video</Th>
            <Th>Status</Th>
            <Th right>Views</Th>
            <Th right>Earned</Th>
          </Head>
          <Body>
            {videos.map((p) => (
              <tr key={p.id}>
                <Td>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {label(p.platform)}
                  </a>
                  {p.repost && <span className="ml-2 text-xs text-muted-foreground">repost</span>}
                </Td>
                <Td muted>{p.reviewed === false ? "Waiting for review" : p.state === "final" ? "Final" : "Counting"}</Td>
                <Td right>{p.views.toLocaleString()}</Td>
                <Td right>{formatCurrency(p.earned)}</Td>
              </tr>
            ))}
          </Body>
        </Table>
      )}

      {cr.statements.length > 0 && (
        <>
          <SectionTitle>Payments</SectionTitle>
          <Table min="34rem">
            <Head>
              <Th>Statement</Th>
              <Th>Status</Th>
              <Th right>Amount</Th>
              <Th right>My fee</Th>
            </Head>
            <Body>
              {cr.statements.map((s) => (
                <tr key={s.id}>
                  <Td>#{s.cycle}</Td>
                  <Td>
                    <StatusBadge tone={s.state === "confirmed" ? "success" : s.state === "overdue" || s.state === "disputed" ? "error" : "pending"}>
                      {STATE_LABEL[s.state]}
                    </StatusBadge>
                  </Td>
                  <Td right>{formatCurrency(s.amount)}</Td>
                  <Td right>
                    {formatCurrency(s.ourFee)}
                    <span className="ml-1 text-xs text-muted-foreground">{s.feeReceived ? "received" : "not received"}</span>
                  </Td>
                </tr>
              ))}
            </Body>
          </Table>
        </>
      )}
    </div>
  );
}
