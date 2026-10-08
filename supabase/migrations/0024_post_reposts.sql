-- ============================================================================
-- 0024: reposts. A campaign pays the base fee per UNIQUE video, not per post.
-- The same video put on a second platform is a repost: it can still earn its view
-- bonus, but it does not earn the base fee again and does not count toward the
-- "paid every N posts" total.
--
--   assignment_posts.repost_of   the original post this one repeats (null = a unique video)
--
-- The site works without this column (every post is then treated as unique), so it is
-- safe to run this before or after the code that uses it.
-- ============================================================================

alter table assignment_posts
  add column if not exists repost_of uuid references assignment_posts(id) on delete set null;

create index if not exists assignment_posts_repost_of_idx on assignment_posts (repost_of);
