import Link from "next/link";
import { PlatformIcon } from "@/components/account/PlatformIcons";
import { StatusPill } from "@/components/tracking/PostsPanel";
import { compactViews } from "@/lib/format";
import { payFor, type PostRowData, type PostTerms } from "@/lib/post-terms";
import { POST_STATUS_KEY, postStatus } from "@/lib/post-status";
import { PLATFORM_LABELS } from "@/lib/utils";

/**
 * The creator's posts on this campaign, newest first, each with where it stands: checking, being reviewed, approved or
 * not approved. Sits under "Add a post", so a link shows its status as soon as it's added.
 */
export function YourPosts({ terms, posts, allHref }: { terms: PostTerms; posts: PostRowData[]; allHref: string }) {
  if (posts.length === 0) return null;
  const calc = new Map(payFor(terms, posts).posts.map((p) => [p.id, p]));
  const shown = posts
    .filter((p) => p.state !== "rejected" || calc.has(p.id) || (p.rejectReason ?? "").length > 0)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  return (
    <section className="mt-6 rounded-xl border border-border/70 bg-card px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base font-semibold text-foreground">Your posts</h2>
        <Link href={allHref} className="text-sm font-semibold text-primary underline underline-offset-2">
          Views and pay
        </Link>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">{POST_STATUS_KEY}</p>
      <ul className="mt-3 flex flex-col divide-y divide-border/70">
        {shown.map((p) => {
          const status = postStatus(p, calc.get(p.id) ?? null);
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
              <PlatformIcon platform={p.platform} className="size-4" />
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline-offset-2 hover:underline">
                {PLATFORM_LABELS[p.platform]} post
              </a>
              <StatusPill status={status} />
              {calc.has(p.id) && <span className="text-muted-foreground tabular-nums">{compactViews(p.views)} views</span>}
              <span className="w-full text-muted-foreground sm:w-auto sm:flex-1">{status.detail}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
