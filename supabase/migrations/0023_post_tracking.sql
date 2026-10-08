-- ============================================================================
-- 0023_post_tracking.sql
--
-- Per-post tracking and pay, for campaigns whose contract pays per video (the
-- Getimg campaign is the first). Three changes:
--
--   jobs.post_terms         the contract terms for such a campaign (base pay per
--                           post, bonus milestones, window, cycle size...).
--                           Null for every existing campaign, which keeps working
--                           exactly as before.
--
--   assignment_posts        one row per video a creator submits on such a
--                           campaign: its link, who posted it and when, how many
--                           views it has, and its 30-day counting window. A post
--                           link can only be used once on the whole platform
--                           (a rejected one frees its link again). Creators read
--                           their own; the counting itself is written by the
--                           server (service role). Admins may correct a post.
--
--   jobs.logo_url          the campaign's logo, shown on its card and page. A link to a
--                           file in the public "campaign-logos" bucket, which only admins
--                           can write to (and only after two-step sign-in).
--
--   jobs.about, jobs.formats, jobs.example_urls
--                           the brand's own words for the campaign page: a short note on
--                           the brand, the formats that work (one per line), and up to 6
--                           example videos (links to public posts).
--
--   direct_payments.cycle   more than one statement per creator per campaign:
--                           the Getimg contract pays after every 15 posts, so a
--                           creator gets a statement per cycle (1, 2, 3...).
--                           Still one statement per cycle.
-- ============================================================================

alter table jobs
  add column post_terms jsonb
    check (post_terms is null or jsonb_typeof(post_terms) = 'object'),
  add column logo_url text
    check (logo_url is null or (logo_url ~* '^https://' and length(logo_url) <= 500)),
  add column about text
    check (about is null or length(about) <= 2000),
  add column formats text
    check (formats is null or length(formats) <= 2000),
  add column example_urls text[] not null default '{}'
    check (cardinality(example_urls) <= 6 and all_https(example_urls));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-logos',
  'campaign-logos',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Logos are public to read (they sit on campaign cards). Only admins can add, replace or
-- remove them; the two-step rule from 0020 already applies to admins on storage.objects.
create policy "campaign logos: public read"
  on storage.objects
  for select
  using (bucket_id = 'campaign-logos');

create policy "campaign logos: admin add"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'campaign-logos' and is_admin());

create policy "campaign logos: admin replace"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'campaign-logos' and is_admin())
  with check (bucket_id = 'campaign-logos' and is_admin());

create policy "campaign logos: admin remove"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'campaign-logos' and is_admin());

create table assignment_posts (
  id               uuid primary key default gen_random_uuid(),
  assignment_id    uuid not null references assignments (id) on delete restrict,
  platform         platform_enum not null,
  url              text not null check (url ~* '^https://' and length(url) between 12 and 500),
  -- The post's identity on its platform (e.g. "tiktok:7391234567890"), so the same
  -- video can't be submitted twice however its link is written.
  post_key         text not null check (length(post_key) between 3 and 200),
  posted_at        timestamptz,
  -- posted_at plus the contract's counting window; views stop counting here.
  window_ends_at   timestamptz,
  state            text not null default 'counting' check (state in ('counting', 'final', 'rejected')),
  -- Whether the post was found on one of the creator's own verified accounts.
  author_verified  boolean not null default false,
  reject_reason    text check (reject_reason is null or length(reject_reason) <= 300),
  views            bigint not null default 0 check (views >= 0),
  views_counted_at timestamptz,
  last_error       text check (last_error is null or length(last_error) <= 300),
  submitted_at     timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- One live use of a post, platform-wide. A rejected post gives its link back.
create unique index assignment_posts_one_use
  on assignment_posts (post_key)
  where state <> 'rejected';

create index assignment_posts_assignment_idx on assignment_posts (assignment_id, submitted_at);
create index assignment_posts_counting_idx on assignment_posts (window_ends_at) where state = 'counting';

alter table assignment_posts enable row level security;

create policy assignment_posts_select on assignment_posts
  for select
  using (
    is_admin()
    or assignment_id in (
      select a.id from assignments a
      join applicants p on p.id = a.applicant_id
      where p.user_id = auth.uid()
    )
  );

-- Admins can correct a post (mark it verified, reject it, fix a count).
create policy assignment_posts_admin_update on assignment_posts
  for update
  using (is_admin())
  with check (is_admin());

-- Several statements per creator per campaign, one per payment cycle.
alter table direct_payments
  drop constraint direct_payments_assignment_id_key,
  add column cycle int not null default 1 check (cycle between 1 and 100),
  add constraint direct_payments_assignment_cycle_key unique (assignment_id, cycle);

-- The new table gets the authenticator rule from 0020 like every other table.
select enforce_admin_mfa();
