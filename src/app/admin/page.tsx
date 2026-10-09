import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, jobStatusTone } from "@/components/ui/status-badge";
import { Body, Head, Table, Td, Th } from "@/components/admin/table";
import { ChevronRight } from "lucide-react";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { getSent } from "@/lib/admin-payments";
import { campaignTasks } from "@/lib/admin-tasks";
import { PLATFORM_LABELS, formatCurrency } from "@/lib/utils";
import { JobForm } from "./jobs/JobForm";
import { Todo, brandNotes } from "@/components/admin/todo";
import { setupIssues } from "@/lib/setup-check";

export const metadata: Metadata = { title: "Campaigns · Admin" };

const STATUS = { open: "Open", filled: "Filled", closed: "Closed" } as const;

// The home page: every campaign, one row each. Open a campaign for its creators, views and money.
export default async function AdminHomePage() {
  const supabase = await createClient();
  const [ws, { sent }, issues, { data: niches }, { data: brands }] = await Promise.all([
    getAdminWorkspace(),
    getSent(),
    setupIssues(),
    supabase.from("niches").select("id, label").eq("is_active", true).order("label"),
    supabase.from("brand_accounts").select("id, company_name").eq("status", "approved").order("company_name"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Campaigns</h1>
        <JobForm niches={niches ?? []} brands={brands ?? []} />
      </header>

      {issues.length > 0 && (
        <section className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <h2 className="font-semibold text-foreground">Setup needed</h2>
          <ul className="mt-2 flex flex-col gap-3">
            {issues.map((i) => (
              <li key={i.title}>
                <p className="font-medium text-foreground">{i.title}</p>
                <p className="text-muted-foreground">{i.fix}</p>
                {i.sql && <code className="mt-1 block overflow-x-auto rounded bg-background px-2 py-1 text-xs">{i.sql}</code>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ws.campaigns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No campaigns yet. Create the first with the button above.
        </p>
      ) : (
        <Table min="60rem">
          <Head>
            <Th>Campaign</Th>
            <Th>Brand</Th>
            <Th>Status</Th>
            <Th>To do</Th>
            <Th right>Creators</Th>
            <Th right>Views</Th>
            <Th right>Earned</Th>
            <Th right>Brand owes</Th>
            <Th right>My earnings</Th>
            <Th />
          </Head>
          <Body>
            {ws.campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <Td className="py-2.5">
                  <Link href={`/admin/jobs/${c.id}`} className="font-medium text-foreground hover:underline">
                    {c.title}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {PLATFORM_LABELS[c.platform as keyof typeof PLATFORM_LABELS] ?? c.platform}
                  </span>
                </Td>
                <Td muted>{c.brandName ?? "No brand yet"}</Td>
                <Td>
                  <StatusBadge tone={jobStatusTone(c.status)}>{STATUS[c.status]}</StatusBadge>
                </Td>
                <Td>
                  <Todo tasks={campaignTasks(c, new Set(sent.keys()))} notes={brandNotes(c)} />
                </Td>
                <Td right>{c.creators.length}</Td>
                <Td right>{c.views.toLocaleString()}</Td>
                <Td right>{formatCurrency(c.earned)}</Td>
                <Td right>{formatCurrency(Math.max(0, c.statemented - c.paid))}</Td>
                <Td right>{formatCurrency(c.ourFees)}</Td>
                <Td right>
                  <Link href={`/admin/jobs/${c.id}`} aria-label={`Open ${c.title}`}>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </Td>
              </tr>
            ))}
          </Body>
        </Table>
      )}
    </div>
  );
}
