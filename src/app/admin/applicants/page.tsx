import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, applicantStatusTone } from "@/components/ui/status-badge";
import { Body, Head, Table, Td, Th } from "@/components/admin/table";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { StatusButtons } from "./ApplicantActions";
import { deleteCreatorAction, deleteCreatorEverythingAction } from "../delete-actions";
import { formatDate, PLATFORM_LABELS } from "@/lib/utils";
import { compactViews } from "@/lib/format";
import { PLATFORM_RULES } from "@/lib/handles";
import type { ApplicantHandle, PlatformEnum } from "@/lib/database.types";

export const metadata: Metadata = { title: "Creators · Admin" };

const STATUS_LABELS: Record<string, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

export default async function AdminApplicantsPage() {
  const supabase = await createClient();
  const { data: applicants } = await supabase.from("applicants").select("*, niches(label)").order("created_at", { ascending: false });
  const all = applicants ?? [];

  // Every account each creator added, fetched once for the page, so their profiles are a click away.
  const { data: handles } = all.length
    ? await supabase
        .from("applicant_handles")
        .select("*")
        .in("applicant_id", all.map((a) => a.id))
        .order("is_primary", { ascending: false })
    : { data: [] };
  const handlesByApplicant = new Map<string, ApplicantHandle[]>();
  for (const h of handles ?? []) handlesByApplicant.set(h.applicant_id, [...(handlesByApplicant.get(h.applicant_id) ?? []), h]);
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
                  <span className="block text-xs text-muted-foreground">{a.email}</span>
                  <Socials handles={handlesByApplicant.get(a.id) ?? []} fallback={{ platform: a.platform, handle: a.handle }} />
                  {(a.bio || a.portfolio_url || a.availability_notes || a.discord_username) && (
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
                    <ConfirmDelete action={deleteCreatorAction} id={a.id} what={a.name} forceAction={deleteCreatorEverythingAction} />
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

/** Links to each account the creator added, with followers (as they told us) and whether we've verified it. */
function Socials({ handles, fallback }: { handles: ApplicantHandle[]; fallback: { platform: PlatformEnum; handle: string | null } }) {
  // Older profiles may only have the one handle on the creator row.
  const list = handles.length
    ? handles
    : fallback.handle
      ? [{ id: "fallback", platform: fallback.platform, handle: fallback.handle, profile_url: null, follower_count: null, verified_at: null }]
      : [];
  if (list.length === 0) return <span className="mt-1 block text-xs text-muted-foreground">No social account added</span>;
  return (
    <ul className="mt-1 flex flex-col gap-0.5 text-xs">
      {list.map((h) => (
        <li key={h.id} className="text-muted-foreground">
          <a
            href={h.profile_url ?? PLATFORM_RULES[h.platform].profileUrl(h.handle)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            {PLATFORM_LABELS[h.platform]} @{h.handle}
          </a>
          {h.follower_count != null && ` · ${compactViews(h.follower_count)} followers`}
          {h.verified_at ? " · Verified" : " · Not verified"}
        </li>
      ))}
    </ul>
  );
}
