-- ============================================================================
-- 0011_brand_accounts.sql
--
-- Brand-side accounts. A brand signs up (company, contact, email), an admin
-- approves it, and an admin attaches campaigns (`jobs`) to it. The brand
-- dashboard (/brand) then shows ITS campaigns, the creators on them and their
-- views.
--
-- Access model: a brand can read its own brand_accounts row (RLS). Everything
-- about its campaigns' creators is fetched server-side with explicit ownership
-- checks, returning only safe columns (names, handles, status, proof, views) —
-- never creator emails or payouts. So no broad policies are opened on
-- assignments/applicants.
-- ============================================================================

create table brand_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  company_name text not null,
  website text,
  contact_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table brand_accounts enable row level security;

create policy brand_accounts_select_own_or_admin on brand_accounts
  for select
  using (is_admin() or user_id = auth.uid());

-- Inserts come from the signup server action (service role); only admins change
-- anything afterwards.
create policy brand_accounts_admin_write on brand_accounts
  for all
  using (is_admin())
  with check (is_admin());

alter table jobs
  add column brand_account_id uuid references brand_accounts (id) on delete set null;

create index jobs_brand_account_idx on jobs (brand_account_id);
