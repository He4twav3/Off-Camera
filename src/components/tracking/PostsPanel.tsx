import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PlatformIcon } from "@/components/account/PlatformIcons";
import { EmptyState } from "@/components/kit/ui";
import { money } from "@/lib/fees";
import { compactViews } from "@/lib/format";
import { payFor, type PostRowData, type PostTerms } from "@/lib/post-terms";
import { cn, PLATFORM_LABELS } from "@/lib/utils";

type Sort = "recent" | "views";

/** "Oct 9, 06:02 UTC": when a post's views were last read. */
function readAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })} UTC`;
}

function Chip({
  href,
  on,
  children,
}: {
  href: string;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm font-medium",
        on
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border/70 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function Tile({
  post,
  note,
  amount,
}: {
  post: PostRowData;
  note: string;
  amount: string | null;
}) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex aspect-[4/5] flex-col justify-between rounded-lg border border-border/70 bg-card p-3 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between">
        <PlatformIcon platform={post.platform} className="size-6" />
        <ExternalLink className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div>
        <p className="font-heading text-xl font-semibold tabular-nums text-foreground">
          {compactViews(post.views)}
        </p>
        <p className="text-xs text-muted-foreground">views</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{note}</p>
        {post.viewsCountedAt && (
          <p className="text-[11px] text-muted-foreground/80">
            Views read {readAt(post.viewsCountedAt)}
          </p>
        )}
        {amount && (
          <p className="text-sm font-semibold text-foreground">{amount}</p>
        )}
      </div>
    </a>
  );
}

/**
 * Every post as a tile: its platform, views and dollars. Recent first, or grouped by how
 * many views it reached, using the contract's own milestones as the groups.
 */
export function PostsPanel({
  terms,
  posts,
  sort,
  basePath,
  viewer = "creator",
  now = new Date(),
}: {
  terms: PostTerms;
  posts: PostRowData[];
  sort: Sort;
  basePath: string;
  viewer?: "creator" | "brand";
  now?: Date;
}) {
  const pay = payFor(terms, posts, now);
  const calc = new Map(pay.posts.map((p) => [p.id, p]));
  const counted = posts.filter((p) => calc.has(p.id));
  const others = posts.filter((p) => !calc.has(p.id));

  const noteOf = (p: PostRowData) => {
    const c = calc.get(p.id);
    if (!c) return p.state === "rejected" ? "Rejected" : "Checking";
    return c.windowClosed
      ? "Final"
      : `${c.daysLeft} ${c.daysLeft === 1 ? "day" : "days"} left`;
  };
  const amountOf = (p: PostRowData) => {
    const c = calc.get(p.id);
    return c ? money(c.base + c.bonus) : null;
  };
  const byRecent = (a: PostRowData, b: PostRowData) =>
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();

  const tiers = [...terms.milestones].sort((a, b) => b.views - a.views);
  const groups: { label: string; items: PostRowData[] }[] = [];
  if (sort === "views") {
    let rest = [...counted].sort((a, b) => b.views - a.views);
    for (const m of tiers) {
      groups.push({
        label: `${compactViews(m.views)}+`,
        items: rest.filter((p) => p.views >= m.views),
      });
      rest = rest.filter((p) => p.views < m.views);
    }
    groups.push({
      label: tiers.length
        ? `Under ${compactViews(tiers[tiers.length - 1].views)}`
        : "All posts",
      items: rest,
    });
  }

  return (
    <section className="mt-5">
      <div className="mb-4 flex gap-2">
        <Chip href={`${basePath}?tab=posts`} on={sort === "recent"}>
          Recent
        </Chip>
        <Chip href={`${basePath}?tab=posts&sort=views`} on={sort === "views"}>
          By views
        </Chip>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          body="Post your video, then add its link. Its views start counting once we've confirmed it's on your account."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {others.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Needs a look
              </h3>
              <ul className="flex flex-col divide-y divide-border/70 rounded-lg border border-border/70 bg-card">
                {others.sort(byRecent).map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-x-3 px-4 py-3 text-sm"
                  >
                    <PlatformIcon platform={p.platform} className="size-4" />
                    <span className="font-medium text-foreground">
                      {PLATFORM_LABELS[p.platform]} post
                    </span>
                    <span className="min-w-0 flex-1 text-muted-foreground">
                      {p.state === "rejected"
                        ? (p.rejectReason ?? "Rejected.")
                        : (p.lastError ??
                          "We're checking that this is your post.")}
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-semibold",
                        p.state === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {p.state === "rejected" ? "Rejected" : "Checking"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sort === "recent"
            ? counted.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {[...counted].sort(byRecent).map((p) => (
                    <li key={p.id}>
                      <Tile post={p} note={noteOf(p)} amount={amountOf(p)} />
                    </li>
                  ))}
                </ul>
              )
            : groups
                .filter((g) => g.items.length > 0)
                .map((g) => (
                  <div key={g.label}>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">
                      {g.label}
                    </h3>
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {g.items.map((p) => (
                        <li key={p.id}>
                          <Tile
                            post={p}
                            note={noteOf(p)}
                            amount={amountOf(p)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
        </div>
      )}
    </section>
  );
}
