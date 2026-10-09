import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireAdminMfa } from "@/lib/admin-mfa";
import { createClient } from "@/lib/supabase/server";
import { postReviews } from "@/lib/post-review";
import { parsePostTerms } from "@/lib/post-terms";
import { PLATFORM_LABELS, formatDate } from "@/lib/utils";
import { approvePostAction, denyPostAsAdminAction } from "./actions";

export const metadata: Metadata = { title: "Post review · Admin" };

export default async function AdminReviewPage() {
  await requireAdminMfa("/admin/review");
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("assignment_posts")
    .select(
      "id, platform, url, views, state, author_verified, submitted_at, posted_at, assignments(applicants(name, handle), jobs(title, post_terms))",
    )
    .neq("state", "rejected")
    .eq("author_verified", true)
    .order("submitted_at", { ascending: true });

  const review = await postReviews((rows ?? []).map((r) => r.id));

  // Only posts on campaigns where OnCamera does the review, and not yet approved.
  const queue = (rows ?? []).filter((r) => {
    const terms = parsePostTerms(r.assignments?.jobs?.post_terms);
    return terms?.reviewer === "oncamera" && !review.approved.has(r.id);
  });

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Post review</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Posts waiting for a check. Open each one, make sure it is a real new video that follows the
          brief, then approve it. Only approved posts count into what a brand owes.
        </p>
      </header>

      {!review.available ? (
        <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
          Review isn&apos;t switched on yet: run migration 0024 (post review) in the Supabase SQL editor.
          Until then every post counts as approved.
        </p>
      ) : queue.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center text-muted-foreground">
          Nothing waiting. New posts appear here once their account has been checked.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/70 rounded-xl border border-border/70 bg-card">
          {queue.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {r.assignments?.applicants?.name ?? "Creator"}{" "}
                  <span className="text-muted-foreground">@{r.assignments?.applicants?.handle}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {r.assignments?.jobs?.title} · {PLATFORM_LABELS[r.platform]} · {Number(r.views).toLocaleString()} views ·
                  added {formatDate(r.submitted_at)}
                </p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary underline underline-offset-2"
                >
                  Open the post
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={approvePostAction}>
                  <input type="hidden" name="post_id" value={r.id} />
                  <button type="submit" className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                    Approve
                  </button>
                </form>
                <form action={denyPostAsAdminAction} className="flex items-center gap-2">
                  <input type="hidden" name="post_id" value={r.id} />
                  <input
                    name="reason"
                    maxLength={200}
                    placeholder="Reason (optional)"
                    aria-label="Reason for denying"
                    className="w-40 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <button type="submit" className="cursor-pointer rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-semibold text-destructive">
                    Deny
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {review.available && (
        <Link
          href="/admin/review/archive"
          className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Archive
          <ChevronRight className="size-3" />
        </Link>
      )}
    </div>
  );
}
