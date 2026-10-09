import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { Body, Figures, Head, SectionTitle, Table, Td, Th } from "@/components/admin/table";
import { CopyButton } from "@/components/admin/copy-button";
import { PayoutCell } from "@/components/admin/payout-cell";
import { StatusBadge } from "@/components/ui/status-badge";
import { STATE_LABEL } from "@/lib/direct-pay";
import { PLATFORM_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { approvePostAction, denyPostAsAdminAction } from "../../../../review/actions";

export const metadata: Metadata = { title: "Creator · Admin" };

const label = (p: string) => PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p;

export default async function AdminCreatorPage(props: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { id, assignmentId } = await props.params;
  const ws = await getAdminWorkspace();
  const c = ws.campaigns.find((x) => x.id === id);
  const cr = c?.creators.find((x) => x.assignmentId === assignmentId);
  if (!c || !cr) notFound();
  const owed = Math.max(0, cr.statemented - cr.paid);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/admin/jobs" className="hover:text-foreground">
          Campaigns
        </Link>
        {" / "}
        <Link href={`/admin/jobs/${c.id}`} className="hover:text-foreground">
          {c.title}
        </Link>
      </nav>
      <header className="mb-6 mt-3">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{cr.name}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-muted-foreground">
          <span>@{cr.handle}</span>
          <span className="flex items-center gap-2">
            {cr.email}
            <CopyButton value={cr.email} />
          </span>
          <span>On “{c.title}”{c.brandName ? ` for ${c.brandName}` : ""}</span>
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-border/70 bg-card p-5">
        <h2 className="font-heading text-base font-semibold text-foreground">Payout details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Where the brand pays this creator.</p>
        <div className="mt-3 text-[15px]">
          <PayoutCell payout={cr.payout} />
        </div>
      </section>

      <Figures
        items={[
          { label: "Videos counting", value: String(cr.videos) },
          { label: "Views", value: cr.views.toLocaleString() },
          { label: "Earned", value: formatCurrency(cr.earned) },
          { label: "Due under the contract", value: formatCurrency(cr.payable) },
          { label: "On statements", value: formatCurrency(cr.statemented) },
          { label: "Paid", value: formatCurrency(cr.paid) },
          { label: "Brand still owes", value: formatCurrency(owed), attention: owed > 0 },
        ]}
      />

      <SectionTitle>Videos</SectionTitle>
      {cr.posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No videos added yet.
        </p>
      ) : (
        <Table min="58rem">
          <Head>
            <Th>Video</Th>
            <Th>State</Th>
            <Th right>Views</Th>
            <Th right>Earned</Th>
            <Th>Added</Th>
            <Th>Review</Th>
          </Head>
          <Body>
            {cr.posts.map((p) => (
              <tr key={p.id}>
                <Td>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {label(p.platform)}
                  </a>
                  {p.repost && <span className="block text-xs text-muted-foreground">Repost: no base pay</span>}
                </Td>
                <Td>
                  {p.state === "rejected" ? (
                    <span className="text-destructive" title={p.rejectReason ?? ""}>
                      Rejected{p.rejectReason ? `: ${p.rejectReason}` : ""}
                    </span>
                  ) : !p.verified ? (
                    <span className="text-muted-foreground">Checking the account</span>
                  ) : p.state === "final" ? (
                    "Final"
                  ) : (
                    "Counting"
                  )}
                </Td>
                <Td right>{p.views.toLocaleString()}</Td>
                <Td right>{formatCurrency(p.earned)}</Td>
                <Td muted>{formatDate(p.submittedAt)}</Td>
                <Td>
                  {p.state === "rejected" ? (
                    <span className="text-muted-foreground">-</span>
                  ) : p.reviewed === true ? (
                    <span className="font-medium text-emerald-400">Approved</span>
                  ) : p.reviewed === undefined ? (
                    <span className="text-muted-foreground">Not tracked yet</span>
                  ) : (
                    <span className="flex flex-wrap items-center gap-3">
                      <form action={approvePostAction}>
                        <input type="hidden" name="post_id" value={p.id} />
                        <button type="submit" className="cursor-pointer text-xs font-semibold text-primary underline underline-offset-2">
                          Approve
                        </button>
                      </form>
                      <form action={denyPostAsAdminAction}>
                        <input type="hidden" name="post_id" value={p.id} />
                        <button type="submit" className="cursor-pointer text-xs font-semibold text-destructive underline underline-offset-2">
                          Deny
                        </button>
                      </form>
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </Body>
        </Table>
      )}

      <SectionTitle aside={<Link href="/admin/statements" className="text-sm font-medium text-primary hover:underline">Open Statements</Link>}>
        Payments
      </SectionTitle>
      {cr.statements.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No statement has been issued yet.{cr.payable > 0 ? ` ${formatCurrency(cr.payable)} is due under the contract: issue one in Statements.` : ""}
        </p>
      ) : (
        <Table min="56rem">
          <Head>
            <Th>Cycle</Th>
            <Th>Status</Th>
            <Th right>Amount</Th>
            <Th right>Our fee</Th>
            <Th>Issued</Th>
            <Th>Due</Th>
            <Th>How it was paid</Th>
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
                  <span className="block text-xs text-muted-foreground">{s.feeReceived ? "received" : "not received"}</span>
                </Td>
                <Td muted>{formatDate(s.issuedAt)}</Td>
                <Td muted>{formatDate(s.dueAt)}</Td>
                <Td muted>
                  {s.brandMethod ? `${s.brandMethod}${s.brandReference ? ` · ${s.brandReference}` : ""}` : "-"}
                </Td>
              </tr>
            ))}
          </Body>
        </Table>
      )}
    </div>
  );
}
