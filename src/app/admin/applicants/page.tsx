import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, applicantStatusTone } from "@/components/ui/status-badge";
import { Body, Head, Table, Td, Th } from "@/components/admin/table";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusButtons, AssignForm } from "./ApplicantActions";
import { deleteCreatorAction } from "../delete-actions";
import { formatDate, PLATFORM_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Creators · Admin" };

const STATUS_LABELS: Record<string, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

export default async function AdminApplicantsPage() {
  const supabase = await createClient();
  const [{ data: applicants }, { data: openJobs }] = await Promise.all([
    supabase.from("applicants").select("*, niches(label)").order("created_at", { ascending: false }),
    supabase.from("jobs").select("id, title, payout_amount").eq("status", "open").order("created_at", { ascending: false }),
  ]);
  const all = applicants ?? [];
  const pending = all.filter((a) => a.status === "pending").length;
  // Waiting first, then the rest by date.
  const rows = [...all.filter((a) => a.status === "pending"), ...all.filter((a) => a.status !== "pending")];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-4">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Creators</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pending} awaiting review · {all.length} total. Deleting is only possible for a creator who hasn&apos;t joined a campaign.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No creators yet. They appear once they complete profile setup.
        </p>
      ) : (
        <Table min="56rem">
          <Head>
            <Th>Creator</Th>
            <Th>Platform</Th>
            <Th>Status</Th>
            <Th>Applied</Th>
            <Th>Actions</Th>
          </Head>
          <Body>
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <Td className="py-2">
                  <span className="font-medium text-foreground">{a.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">@{a.handle}</span>
                  <span className="block text-xs text-muted-foreground">{a.email}</span>
                  {(a.bio || a.portfolio_url || a.availability_notes || a.status === "approved") && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs font-medium text-primary">Details</summary>
                      <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground">
                        <p>Discord: {a.discord_username ?? "not connected"}</p>
                        {a.availability_notes && <p>Availability: {a.availability_notes}</p>}
                        {a.portfolio_url && (
                          <p>
                            Portfolio:{" "}
                            <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                              {a.portfolio_url}
                            </a>
                          </p>
                        )}
                        {a.bio && <p className="max-w-xl whitespace-pre-line">{a.bio}</p>}
                        {a.status === "approved" && (openJobs ?? []).length > 0 && (
                          <div className="mt-1">
                            <AssignForm applicantId={a.id} openJobs={openJobs ?? []} />
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </Td>
                <Td className="py-2" muted>
                  {PLATFORM_LABELS[a.platform]}
                  {a.niches && <span className="block text-xs">{a.niches.label}</span>}
                </Td>
                <Td className="py-2">
                  <StatusBadge tone={applicantStatusTone(a.status)}>{STATUS_LABELS[a.status]}</StatusBadge>
                </Td>
                <Td className="py-2" muted>{formatDate(a.created_at)}</Td>
                <Td className="py-2">
                  <div className="flex flex-col gap-1.5">
                    <StatusButtons applicantId={a.id} status={a.status} />
                    <ConfirmDelete action={deleteCreatorAction} id={a.id} what={a.name} />
                  </div>
                </Td>
              </tr>
            ))}
          </Body>
        </Table>
      )}
    </div>
  );
}
