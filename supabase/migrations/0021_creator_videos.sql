-- ============================================================================
-- 0021_creator_videos.sql
--
-- Creators keep a list of their own videos on their profile, and choose which of
-- them to apply to a campaign with.
--
--   applicant_videos      the creator's videos: a link to a post on TikTok,
--                         Instagram, YouTube or X, with an optional short title.
--                         At most 12 per creator. Owner reads, adds and removes
--                         their own; admins read. (The authenticator rule from
--                         0020 is added at the end.)
--   applications.video_urls
--                         the videos picked for THIS application, copied at the
--                         moment of applying. A copy, not a pointer, so changing
--                         the profile later doesn't change an application that
--                         was already sent. Up to 5, https links only.
--
-- A campaign that asks for a sample video still uses applications.sample_url
-- (a Google Drive link, 0014). The picked videos are always part of the
-- application; the sample video is added on top when the brand asks for one.
-- ============================================================================

create table applicant_videos (
  id           uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references applicants (id) on delete cascade,
  platform     platform_enum not null,
  url          text not null check (url ~* '^https://' and length(url) between 12 and 500),
  title        text check (title is null or length(title) <= 80),
  created_at   timestamptz not null default now(),
  -- The same video can't be listed twice.
  unique (applicant_id, url)
);

create index applicant_videos_applicant_idx on applicant_videos (applicant_id, created_at desc);

alter table applicant_videos enable row level security;

create policy applicant_videos_select on applicant_videos
  for select
  using (
    is_admin()
    or applicant_id in (select id from applicants where user_id = auth.uid())
  );

create policy applicant_videos_insert_own on applicant_videos
  for insert
  with check (applicant_id in (select id from applicants where user_id = auth.uid()));

create policy applicant_videos_delete_own on applicant_videos
  for delete
  using (applicant_id in (select id from applicants where user_id = auth.uid()));

-- At most 12 videos per creator. The lock stops two quick adds from both squeezing
-- in under the limit.
create function limit_applicant_videos()
returns trigger
language plpgsql
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.applicant_id::text));
  if (select count(*) from applicant_videos where applicant_id = new.applicant_id) >= 12 then
    raise exception 'too_many_videos';
  end if;
  return new;
end;
$$;

create trigger applicant_videos_limit
  before insert on applicant_videos
  for each row
  execute function limit_applicant_videos();

-- The videos picked for an application. Links only; nothing but https is accepted,
-- so a crafted application can't carry a javascript: or data: link into the admin page.
create function all_https(urls text[])
returns boolean
language sql
immutable
as $$
  select coalesce(bool_and(u ~* '^https://' and length(u) <= 500), true) from unnest(urls) as u;
$$;

alter table applications
  add column video_urls text[] not null default '{}'
    check (cardinality(video_urls) <= 5 and all_https(video_urls));

-- The new table gets the authenticator rule from 0020 like every other table.
select enforce_admin_mfa();
