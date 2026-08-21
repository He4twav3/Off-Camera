-- ============================================================
-- Run this in the Supabase SQL Editor.
-- Adds: the landing-page application form's table + video
--       storage, and closes the public job board.
-- ============================================================

-- ============================================================================
-- 0004_leads.sql
--
-- A "lead" is someone who filled in the short form on the landing page before
-- they have an account. It exists to shorten the top of the funnel: three
-- fields and they're done, and you qualify them afterwards.
--
-- Deliberately separate from `applicants`:
--   * `applicants` is a real account with a user_id, RLS scoped to that user,
--     and a profile they maintain. A lead has none of that — it's an inbox.
--   * Leads can be spam. Keeping them apart means junk never pollutes the
--     table your assignment and payout logic reads from.
--   * Approving a lead is what mints the account, so the two have a clean
--     one-way relationship rather than a half-populated applicant row sitting
--     around in an odd state.
-- ============================================================================

create type lead_status_enum as enum (
  'new',       -- waiting on you
  'invited',   -- approved; signup link sent
  'joined',    -- they took the invite and made an account
  'rejected'
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  -- Handles as free text at this stage. The strict per-platform validation
  -- lives in profile setup; demanding it here would defeat the point of a
  -- 20-second form.
  handles text not null,
  brands_worked_with text,
  sample_video_path text,
  comments text,
  status lead_status_enum not null default 'new',
  -- Referral attribution from ?ref= on the landing page.
  referred_by text,
  -- Set when the lead is approved and turned into an account.
  applicant_id uuid references applicants(id) on delete set null,
  invited_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index leads_status_idx on leads (status);
create index leads_created_idx on leads (created_at desc);
create index leads_referred_by_idx on leads (referred_by) where referred_by is not null;

-- One live application per email. A second submission updates the first rather
-- than filling your queue with duplicates from someone who double-tapped.
create unique index leads_email_unique on leads (lower(email));

alter table leads enable row level security;

-- Anyone can submit the landing-page form, including logged-out visitors.
-- This is the one intentionally public write in the schema — it's a contact
-- form. Abuse protection is reCAPTCHA on the form plus the unique-email index,
-- not RLS.
create policy leads_insert_public on leads
  for insert
  with check (true);

-- Nobody but an admin can read them back. Without this, that public insert
-- policy would let anyone enumerate every applicant's email and phone number.
create policy leads_select_admin on leads
  for select
  using (is_admin());

create policy leads_update_admin on leads
  for update
  using (is_admin())
  with check (is_admin());

create policy leads_delete_admin on leads
  for delete
  using (is_admin());

-- ---------------------------------------------------------------------------
-- Work sample storage
-- ---------------------------------------------------------------------------
-- Private bucket: sample videos are the creator's own work and shouldn't be
-- publicly enumerable. Admin views them through a signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'work-samples',
  'work-samples',
  false,
  104857600, -- 100 MB
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

-- Uploads are open, for the same reason the insert policy above is: the person
-- uploading has no account yet. The bucket's own size and MIME limits do the
-- heavy lifting, and files are namespaced by a random id from the client.
create policy "work samples: public upload"
  on storage.objects
  for insert
  with check (bucket_id = 'work-samples');

-- Reading is admin-only. Combined with the private bucket, a sample video is
-- reachable only through a signed URL an admin generates.
create policy "work samples: admin read"
  on storage.objects
  for select
  using (bucket_id = 'work-samples' and is_admin());

create policy "work samples: admin delete"
  on storage.objects
  for delete
  using (bucket_id = 'work-samples' and is_admin());

-- ============================================================================
-- 0005_gate_job_board.sql
--
-- The job board is no longer public. Campaign listings — payouts, niches,
-- volume — are commercially sensitive: they tell a competitor exactly what we
-- pay and what we're running. Now that the landing page has its own apply
-- form, nobody needs to browse jobs to get in touch.
--
-- Hiding the link in the UI would not have been enough. The anon key ships to
-- every browser, so anyone could have read the table straight off the REST
-- API. This moves the gate into Postgres, where it actually holds.
-- ============================================================================

drop policy if exists jobs_select_all on jobs;

create policy jobs_select_authenticated on jobs
  for select
  using (auth.uid() is not null or is_admin());

-- Niches stay readable: they're just category labels, they leak nothing, and
-- the signup/profile forms need them.
