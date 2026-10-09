import "server-only";
import { postReviews } from "@/lib/post-review";
import { getSent } from "@/lib/admin-payments";

export type SetupIssue = { title: string; fix: string; sql?: string };

/**
 * What the live database is still missing, so nothing fails quietly. Empty when all is set up.
 * Each fix names the migration file in the repo.
 */
export async function setupIssues(): Promise<SetupIssue[]> {
  const [review, sent] = await Promise.all([postReviews([]), getSent()]);
  const issues: SetupIssue[] = [];
  if (!review.available)
    issues.push({
      title: "Post approval and the archive are switched off",
      fix: "Run migration 0024 (supabase/migrations/0024_post_review.sql) in the Supabase SQL editor. Until then every post counts as approved.",
      sql: "alter table assignment_posts add column if not exists reviewed_at timestamptz;",
    });
  if (!sent.auditAvailable)
    issues.push({
      title: "“Mark as sent” can't be saved",
      fix: "Run migration 0017 (supabase/migrations/0017_withdrawal_safeguards.sql, the admin audit log) in the Supabase SQL editor. Emails still work; the sent marks won't show.",
    });
  return issues;
}
