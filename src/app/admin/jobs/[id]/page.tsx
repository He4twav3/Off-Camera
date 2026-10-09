import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, jobStatusTone } from "@/components/ui/status-badge";
import { Body, Figures, Head, SectionTitle, Table, Td, Th } from "@/components/admin/table";
import { PayoutCell } from "@/components/admin/payout-cell";
import { loadAdminWorkspace } from "@/lib/admin-workspace";
import { postTermsChips } from "@/lib/post-terms";
import { PLATFORM_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { JobForm } from "../JobForm";
import { deleteEmptyJobAction } from "../actions";
import { PayTermsForm } from "./PayTermsForm";

export const metadata: Metadata = { title: "Campaign · Admin" };

const STATUS = { open: "Open", filled: "Filled", closed: "Closed" } as const;

export default async function AdminCampaignPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const [ws, { data: job }, { data: niches }, { data: brands }] = await Promise.all([
    loadAdminWorkspace(supabase),
    supabase.from("jobs").select("*, niches(label)").eq("id", id).maybeSingle(),
    supabase.from("niches").select("id, label").eq("is_active", true).order("label"),
    supabase.from("brand_accounts").select("id, company_name").eq("status", "approved").order("company_name"),
  ]);
  const c = ws.campaigns.find((x) => x.id === id);
  if (!job || !c) notFound();
  const owed = Math.max(0, c.statemented - c.paid);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link href="/admin/jobs" className="text-sm text-muted-foreground hover:text-foreground">
        ← Campaigns
      </Link>
      <header className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-semibold text-foreground">{c.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[15px] text-muted-foreground">
            <StatusBadge tone={jobStatusTone(c.status)}>{STATUS[c.status]}</StatusBadge>
            <span>{PLATFORM_LABELS[c.platform as keyof typeof PLATFORM_LABELS] ?? c.platform}</span>
            {c.nicheLabel && <span>· {c.nicheLabel}</span>}
            <span>· Brand: {c.brandName ?? "none attached"}</span>
            <span>· Started {formatDate(c.createdAt)}</span>
          </p>
          {c.terms && (
            <p className="mt-3 flex flex-wrap gap-2">
              {postTermsChips(c.terms).map((chip) => (
                <span key={chip} className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {chip}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <JobForm niches={niches ?? []} brands={brands ?? []} job={job} />
          <Link href={`/admin/jobs/${c.id}/contract`} className="text-sm font-semibold text-primary underline underline-offset-2">
            Contract
          </Link>
        </div>
      </header>

      <Figures
        items={[
          { label: "Views", value: c.views.toLocaleString() },
          { label: "Videos counting", value: String(c.videos) },
          { label: "Creators", value: String(c.creators.length) },
          { label: "Earned by creators", value: formatCurrency(c.earned) },
          { label: "Brand owes", value: formatCurrency(owed), attention: owed > 0 },
          { label: "Paid", value: formatCurrency(c.paid) },
          { label: "Our fees", value: formatCurrency(c.ourFees), hint: `${formatCurrency(c.feesOutstanding)} not received` },
        ]}
      />

      <SectionTitle>Creators on this campaign</SectionTitle>
      {c.creators.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Nobody has joined this campaign yet.
        </p>
      ) : (
        <Table min="68rem">
          <Head>
            <Th>Creator</Th>
            <Th right>Videos</Th>
            <Th right>Views</Th>
            <Th right>Earned</Th>
            <Th right>My earnings</Th>
            <Th right>On statements</Th>
            <Th right>Paid</Th>
            <Th right>In review</Th>
            <Th>Payout</Th>
          </Head>
          <Body>
            {[...c.creators].sort((a, b) => b.views - a.views).map((cr) => (
              <tr key={cr.assignmentId} className="hover:bg-muted/30">
                <Td>
                  <Link href={`/admin/jobs/${c.id}/creators/${cr.assignmentId}`} className="font-medium text-foreground hover:underline">
                    {cr.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{cr.email}</span>
                </Td>
                <Td right>{cr.videos}</Td>
                <Td right>{cr.views.toLocaleString()}</Td>
                <Td right>{formatCurrency(cr.earned)}</Td>
                <Td right>{formatCurrency(cr.ourFees)}</Td>
                <Td right>{formatCurrency(cr.statemented)}</Td>
                <Td right>{formatCurrency(cr.paid)}</Td>
                <Td right>{cr.awaitingReview}</Td>
                <Td>
                  <PayoutCell payout={cr.payout} />
                </Td>
              </tr>
            ))}
          </Body>
        </Table>
      )}

      <SectionTitle>Pay terms (the contract)</SectionTitle>
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <PayTermsForm jobId={c.id} terms={c.terms} />
      </div>

      <SectionTitle>Remove campaign</SectionTitle>
      <div className="rounded-xl border border-border/70 bg-card p-5">
        {c.creators.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            This campaign has creators on it, so it can&apos;t be deleted. Set its status to Closed in Edit instead.
          </p>
        ) : (
          <form action={deleteEmptyJobAction} className="flex flex-wrap items-center gap-4">
            <input type="hidden" name="id" value={c.id} />
            <p className="text-sm text-muted-foreground">Nobody has joined, so it can be deleted for good.</p>
            <button type="submit" className="cursor-pointer rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-semibold text-destructive">
              Delete campaign
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
