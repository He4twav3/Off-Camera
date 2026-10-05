-- ============================================================================
-- 0008_campaign_views.sql
--
-- Per-campaign view counts, written by the in-house view counter
-- (lib/campaign-views.ts). One row per (campaign, platform, handle); the counter
-- upserts so a re-run refreshes the number instead of adding a duplicate.
--
-- Writes: service role only (server-side code) — there is deliberately no
-- insert/update policy, so nothing signed-in or anonymous can write here.
-- Reads: a creator sees only rows for handles on their own applicant profile;
-- admins see everything. `handle` is stored lowercase so the match and the
-- unique key are case-insensitive.
-- ============================================================================

create table campaign_views (
  id uuid primary key default gen_random_uuid(),
  campaign text not null default '',
  platform platform_enum not null,
  handle text not null,
  views bigint not null default 0 check (views >= 0),
  updated_at timestamptz not null default now(),
  unique (campaign, platform, handle)
);

create index campaign_views_handle_idx on campaign_views (handle);

alter table campaign_views enable row level security;

create policy campaign_views_select_own on campaign_views
  for select
  using (
    is_admin()
    or exists (
      select 1
      from applicants a
      left join applicant_handles ah on ah.applicant_id = a.id
      where a.user_id = auth.uid()
        and (
          lower(a.handle) = campaign_views.handle
          or lower(ah.handle) = campaign_views.handle
        )
    )
  );
