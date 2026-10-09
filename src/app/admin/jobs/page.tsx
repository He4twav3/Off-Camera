import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, jobStatusTone } from "@/components/ui/status-badge";
import { Body, Head, Table, Td, Th } from "@/components/admin/table";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { postTermsChips } from "@/lib/post-terms";
import { PLATFORM_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { JobForm } from "./JobForm";

export const metadata: Metadata = { title: "Campaigns · Admin" };

const STATUS = { open: "Open", filled: "Filled", closed: "Closed" } as const;

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const [ws, { data: niches }, { data: brands }] = await Promise.all([
    getAdminWorkspace(),
    supabase.from("niches").select("id, label").eq("is_active", true).order("label"),
    supabase.from("brand_accounts").select("id, company_name").eq("status", "approved").order("company_name"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Campaigns</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Open a campaign to see its creators, their videos and payments, and to edit its pay terms and details.
          </p>
        </div>
        <JobForm niches={niches ?? []} brands={brands ?? []} />
      </header>

      {ws.campaigns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          No campaigns yet. Create the first with the button above.
        </p>
      ) : (
        <Table min="60rem">
          <Head>
            <Th>Campaign</Th>
            <Th>Brand</Th>
            <Th>Status</Th>
            <Th>Pay</Th>
            <Th right>Creators</Th>
            <Th right>Videos</Th>
            <Th right>Views</Th>
            <Th right>Earned</Th>
            <Th right>Brand owes</Th>
            <Th right>In review</Th>
          </Head>
          <Body>
            {ws.campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <Td>
                  <Link href={`/admin/jobs/${c.id}`} className="font-medium text-foreground hover:underline">
                    {c.title}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {PLATFORM_LABELS[c.platform as keyof typeof PLATFORM_LABELS] ?? c.platform}
                    {c.nicheLabel ? ` · ${c.nicheLabel}` : ""} · {formatDate(c.createdAt)}
                  </span>
                </Td>
                <Td muted>{c.brandName ?? "No brand yet"}</Td>
                <Td>
                  <StatusBadge tone={jobStatusTone(c.status)}>{STATUS[c.status]}</StatusBadge>
                </Td>
                <Td muted>{c.terms ? postTermsChips(c.terms)[0] : "Older formula"}</Td>
                <Td right>{c.creators.length}</Td>
                <Td right>{c.videos}</Td>
                <Td right>{c.views.toLocaleString()}</Td>
                <Td right>{formatCurrency(c.earned)}</Td>
                <Td right>{formatCurrency(Math.max(0, c.statemented - c.paid))}</Td>
                <Td right>{c.awaitingReview}</Td>
              </tr>
            ))}
          </Body>
        </Table>
      )}
    </div>
  );
}
