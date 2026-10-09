import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminMfa } from "@/lib/admin-mfa";
import { createClient } from "@/lib/supabase/server";
import { postReviews } from "@/lib/post-review";
import { PLATFORM_LABELS, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Archive · Admin" };

/** Posts that were approved. They leave Post review and are kept here. */
export default async function AdminReviewArchivePage() {
  await requireAdminMfa("/admin/review/archive");
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("assignment_posts")
    .select(
      "id, platform, url, views, assignments(applicants(name, handle), jobs(title))",
    )
    .neq("state", "rejected")
    .eq("author_verified", true);

  const review = await postReviews((rows ?? []).map((r) => r.id));
  const done = (rows ?? [])
    .filter((r) => review.approved.has(r.id))
    .sort((a, b) => (review.approvedAt.get(b.id) ?? "").localeCompare(review.approvedAt.get(a.id) ?? ""));

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <Link href="/admin/review" className="text-sm text-muted-foreground hover:text-foreground">
        ← Post review
      </Link>
      <h1 className="mt-3 mb-6 font-heading text-2xl font-semibold text-foreground">Archive</h1>
      {done.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground">
          Nothing archived yet. Approved posts are kept here.
        </p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card">
          {done.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {r.assignments?.applicants?.name ?? "Creator"}{" "}
                  <span className="text-muted-foreground">@{r.assignments?.applicants?.handle}</span>
                </p>
                <p className="text-muted-foreground">
                  {r.assignments?.jobs?.title} · {PLATFORM_LABELS[r.platform]} · {Number(r.views).toLocaleString()} views
                  {review.approvedAt.get(r.id) ? ` · approved ${formatDate(review.approvedAt.get(r.id)!)}` : ""}
                </p>
              </div>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">
                Open the post
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
