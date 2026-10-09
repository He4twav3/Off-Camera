import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, jobStatusTone } from "@/components/ui/status-badge";
import { Body, Head, SectionTitle, Table, Td, Th } from "@/components/admin/table";
import { ChevronRight } from "lucide-react";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { getSent } from "@/lib/admin-payments";
import { campaignTasks } from "@/lib/admin-tasks";
import { Todo, waitingOnBrand } from "@/components/admin/todo";
import { postTermsChips } from "@/lib/post-terms";
import { PLATFORM_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { JobForm } from "../JobForm";

export const metadata: Metadata = { title: "Campaign · Admin" };

const STATUS = { open: "Open", filled: "Filled", closed: "Closed" } as const;

export default async function AdminCampaignPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const [ws, { sent }, { data: job }, { data: niches }, { data: brands }] = await Promise.all([
    getAdminWorkspace(),
    getSent(),
    supabase.from("jobs").select("*, niches(label)").eq("id", id).maybeSingle(),
    supabase.from("niches").select("id, label").eq("is_active", true).order("label"),
    supabase.from("brand_accounts").select("id, company_name").eq("status", "approved").order("company_name"),
  ]);
  const c = ws.campaigns.find((x) => x.id === id);
  if (!job || !c) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
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
          <Link href={`/admin/jobs/${c.id}/terms`} className="text-sm font-semibold text-primary underline underline-offset-2">
            Pay terms
          </Link>
          <Link href={`/admin/jobs/${c.id}/contract`} className="text-sm font-semibold text-primary underline underline-offset-2">
            Contract
          </Link>
        </div>
      </header>

      <section className="mb-6 rounded-xl border border-border/70 bg-card px-4 py-3">
        <h2 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">To do on this campaign</h2>
        <Todo tasks={campaignTasks(c, new Set(sent.keys()))} waiting={waitingOnBrand(c)} />
      </section>

      <SectionTitle>Creators</SectionTitle>
      {c.creators.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Nobody has joined this campaign yet.
        </p>
      ) : (
        <Table min="52rem">
          <Head>
            <Th>Creator</Th>
            <Th>Verified accounts</Th>
            <Th right>Videos</Th>
            <Th right>Views</Th>
            <Th right>Earned</Th>
            <Th right>My earnings</Th>
            <Th right>Paid</Th>
            <Th />
          </Head>
          <Body>
            {[...c.creators].sort((a, b) => b.views - a.views).map((cr) => (
              <tr key={cr.assignmentId} className="hover:bg-muted/30">
                <Td>
                  <Link href={`/admin/jobs/${c.id}/creators/${cr.assignmentId}`} className="font-medium text-foreground hover:underline">
                    {cr.name}
                  </Link>
                </Td>
                <Td muted>
                  {cr.accounts.filter((a) => a.verified).length === 0
                    ? "None yet"
                    : cr.accounts
                        .filter((a) => a.verified)
                        .map((a) => `@${a.handle.replace(/^@/, "")}`)
                        .join(", ")}
                </Td>
                <Td right>{cr.videos}</Td>
                <Td right>{cr.views.toLocaleString()}</Td>
                <Td right>{formatCurrency(cr.earned)}</Td>
                <Td right>{formatCurrency(cr.ourFees)}</Td>
                <Td right>{formatCurrency(cr.paid)}</Td>
                <Td right>
                  <Link href={`/admin/jobs/${c.id}/creators/${cr.assignmentId}`} aria-label={`Open ${cr.name}`}>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </Td>
              </tr>
            ))}
            <tr className="bg-muted/30 font-medium">
              <Td>Total</Td>
              <Td />
              <Td right>{c.videos}</Td>
              <Td right>{c.views.toLocaleString()}</Td>
              <Td right>{formatCurrency(c.earned)}</Td>
              <Td right>{formatCurrency(c.ourFees)}</Td>
              <Td right>{formatCurrency(c.paid)}</Td>
              <Td />
            </tr>
          </Body>
        </Table>
      )}

    </div>
  );
}
