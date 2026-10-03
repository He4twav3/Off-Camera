-- ============================================================================
-- 0009_campaign_signups.sql
--
-- Replaces the Zapier "Creator Submissions" table. /campaign writes a row here
-- (server action, service role); an admin approves it at /admin/campaigns; the
-- view counter then fills `campaign_views` (migration 0008) for the creator's
-- handles. No public policies at all: signups are written only by the server
-- action and read/updated only by admins.
-- ============================================================================

create table campaign_signups (
  id uuid primary key default gen_random_uuid(),
  creator_name text not null,
  campaign text not null default '',
  instagram_handle text not null default '',
  tiktok_handle text not null default '',
  youtube_handle text not null default '',
  -- Optional, newline-separated post URLs. Empty -> counted by campaign hashtag.
  post_links text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  last_counted_at timestamptz,
  -- Last counting failure (shown in admin); null when the last run was clean.
  count_error text,
  created_at timestamptz not null default now()
);

create index campaign_signups_status_idx on campaign_signups (status);
create index campaign_signups_created_idx on campaign_signups (created_at desc);

alter table campaign_signups enable row level security;

create policy campaign_signups_admin_all on campaign_signups
  for all
  using (is_admin())
  with check (is_admin());
