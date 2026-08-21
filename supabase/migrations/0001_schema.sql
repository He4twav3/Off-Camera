-- ============================================================================
-- 0001_schema.sql
-- Core schema for the creator recruiting agency job board.
--
-- Deviations from the literal spec column list, and why:
--   - `niches` is a real table (not a Postgres enum) because the spec calls
--     out "make this editable, not hardcoded." `jobs.niche_id` and
--     `applicants.niche_interest_id` both reference it.
--   - `applicants.user_id` links the row to auth.users — required for RLS
--     (auth.uid()) and wasn't listed explicitly but is implied by "authenticated
--     applicant" pages.
--   - `applicants.date_of_birth`, `.marketing_opt_in`, `.weekly_digest_opt_in`,
--     `.tos_accepted_at` back features described in the Pages/Requirements
--     sections (age gate, signup checkboxes, opt-in digest) that need a column
--     to persist to, even though they weren't in the original column list.
--   - `jobs.notion_sop_url` backs "a link out to the relevant Notion SOP doc"
--     on the dashboard — no field existed in the spec to hold it.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type platform_enum as enum ('tiktok', 'instagram', 'youtube_shorts', 'x');
create type payout_type_enum as enum ('flat', 'cpm', 'retainer');
create type account_requirement_enum as enum ('new_ok', 'established_required');
create type job_status_enum as enum ('open', 'filled', 'closed');
create type applicant_status_enum as enum ('pending', 'approved', 'rejected');
create type assignment_status_enum as enum ('active', 'submitted', 'paid', 'disputed');

-- ---------------------------------------------------------------------------
-- niches — editable lookup table (admin-manageable), not a hardcoded enum
-- ---------------------------------------------------------------------------
create table niches (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
create table jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  platform platform_enum not null,
  niche_id uuid not null references niches(id),
  payout_type payout_type_enum not null,
  payout_amount numeric(10, 2) not null check (payout_amount >= 0),
  payout_notes text,
  account_requirement account_requirement_enum not null default 'new_ok',
  status job_status_enum not null default 'open',
  notion_sop_url text,
  created_at timestamptz not null default now()
);

create index jobs_status_idx on jobs (status);
create index jobs_platform_idx on jobs (platform);
create index jobs_niche_idx on jobs (niche_id);

-- ---------------------------------------------------------------------------
-- applicants
-- ---------------------------------------------------------------------------
create table applicants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  handle text not null,
  platform platform_enum not null,
  niche_interest_id uuid references niches(id),
  availability_notes text,
  skills text[] not null default '{}',
  preferred_pay_min numeric(10, 2),
  preferred_pay_max numeric(10, 2),
  bio text,
  portfolio_url text,
  date_of_birth date,
  email_verified boolean not null default false,
  status applicant_status_enum not null default 'pending',
  marketing_opt_in boolean not null default false,
  weekly_digest_opt_in boolean not null default false,
  tos_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint preferred_pay_range_valid check (
    preferred_pay_min is null
    or preferred_pay_max is null
    or preferred_pay_min <= preferred_pay_max
  )
);

create index applicants_status_idx on applicants (status);
create index applicants_user_id_idx on applicants (user_id);

-- ---------------------------------------------------------------------------
-- assignments
-- ---------------------------------------------------------------------------
create table assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  applicant_id uuid not null references applicants(id),
  applicant_payout_amount numeric(10, 2) not null check (applicant_payout_amount >= 0),
  status assignment_status_enum not null default 'active',
  proof_url text,
  assigned_at timestamptz not null default now(),
  paid_at timestamptz
);

create index assignments_applicant_idx on assignments (applicant_id);
create index assignments_job_idx on assignments (job_id);
create index assignments_status_idx on assignments (status);

-- ---------------------------------------------------------------------------
-- payouts — admin-only economics; gross_amount must never reach applicants
-- ---------------------------------------------------------------------------
create table payouts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references assignments(id),
  gross_amount numeric(10, 2) not null check (gross_amount >= 0),
  applicant_payout_amount numeric(10, 2) not null check (applicant_payout_amount >= 0),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
