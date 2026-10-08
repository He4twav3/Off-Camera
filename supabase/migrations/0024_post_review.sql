-- ============================================================================
-- 0024: post review. Every post is checked before it is paid: by OnCamera (the default,
-- so brands don't have to) or by the brand, as the brand chooses for its campaign (the
-- choice itself lives in jobs.post_terms, no column needed).
--
--   assignment_posts.reviewed_at   when a reviewer approved the post (null = still in review)
--
-- Only approved posts count into what is due on a statement. The site works without this
-- column (every post is then treated as approved), so it is safe to run before or after
-- the code that uses it.
-- ============================================================================

alter table assignment_posts add column if not exists reviewed_at timestamptz;

create index if not exists assignment_posts_review_idx
  on assignment_posts (assignment_id) where reviewed_at is null;
