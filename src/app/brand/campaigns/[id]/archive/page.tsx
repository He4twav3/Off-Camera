import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader, PageShell } from "@/components/kit/ui";
import { PLATFORM_LABELS, formatDate } from "@/lib/utils";
import { loadBrandPage } from "../../../_brand";
import { PendingNotice } from "../../../PendingNotice";

export const metadata: Metadata = { title: "Archive" };

/** Videos that were approved. They leave the approval list and are kept here. */
export default async function BrandArchivePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { brand, ws, approved } = await loadBrandPage(`/brand/campaigns/${id}/archive`);
  if (!approved)
    return (
      <PageShell>
        <PendingNotice status={brand.status} />
      </PageShell>
    );
  const c = ws.campaigns.find((x) => x.id === id);
  if (!c) notFound();
  const rows = c.posts
    .filter((p) => p.counted && p.reviewed === true)
    .sort((a, b) => new Date(b.approvedAt ?? b.submittedAt).getTime() - new Date(a.approvedAt ?? a.submittedAt).getTime());

  return (
    <PageShell>
      <Link href={`/brand/campaigns/${c.id}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← {c.title}
      </Link>
      <div className="mt-3">
        <PageHeader title="Archive" summary="Videos you have approved." />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Nothing archived yet" body="Approved videos are kept here." />
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{p.creatorName}</p>
                <p className="text-muted-foreground">
                  {PLATFORM_LABELS[p.platform as keyof typeof PLATFORM_LABELS] ?? p.platform} · {p.views.toLocaleString()} views
                  {p.approvedAt ? ` · approved ${formatDate(p.approvedAt)}` : ""}
                </p>
              </div>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">
                Watch
              </a>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
