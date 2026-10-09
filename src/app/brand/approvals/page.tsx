import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState, PageHeader, PageShell } from "@/components/kit/ui";
import { PLATFORM_LABELS, formatDate } from "@/lib/utils";
import { loadBrandPage } from "../_brand";
import { PendingNotice } from "../PendingNotice";
import { ApprovePostForm, DenyPostForm } from "../DenyPostForm";

export const metadata: Metadata = { title: "Approvals" };

const label = (p: string) => PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p;

/**
 * Every video waiting for the brand's approval, across all campaigns, in one list. Only campaigns where
 * the brand chose to approve its own videos appear; on the others OnCamera does it.
 */
export default async function BrandApprovalsPage() {
  const { brand, ws, approved } = await loadBrandPage("/brand/approvals");
  if (!approved)
    return (
      <PageShell>
        <PageHeader title="Approvals" />
        <PendingNotice status={brand.status} />
      </PageShell>
    );

  const own = ws.campaigns.filter((c) => c.reviewer === "brand");
  const queue = own
    .flatMap((c) => c.posts)
    .filter((p) => p.counted && p.reviewed === false)
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  const archived = own.flatMap((c) => c.posts).filter((p) => p.counted && p.reviewed === true).length;

  return (
    <PageShell>
      <PageHeader
        title="Approvals"
        summary={
          own.length === 0
            ? "OnCamera is approving the videos on all your campaigns."
            : "Check each video, then approve or deny it. Approved videos count towards what you owe."
        }
      />
      {!ws.reviewAvailable ? (
        <EmptyState title="Video approval is being switched on" body="This will work on your account shortly." />
      ) : own.length === 0 ? (
        <EmptyState
          title="Nothing for you to approve"
          body="OnCamera checks every video for you. To approve them yourself, open a campaign and choose “I approve”."
        />
      ) : queue.length === 0 ? (
        <EmptyState title="Nothing waiting" body="New videos appear here once the creator's account is checked." />
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card">
          {queue.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{p.creatorName}</p>
                <p className="text-muted-foreground">
                  {p.campaignTitle} · {label(p.platform)} · {p.views.toLocaleString()} views · added {formatDate(p.submittedAt)}
                </p>
              </div>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">
                Watch
              </a>
              <span className="flex items-center gap-3">
                <ApprovePostForm postId={p.id} />
                <DenyPostForm postId={p.id} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {ws.reviewAvailable && own.length > 0 && (
        <Link href="/brand/approvals/archive" className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Archive ({archived})
          <ChevronRight className="size-3" />
        </Link>
      )}
    </PageShell>
  );
}
