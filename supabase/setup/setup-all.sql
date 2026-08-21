-- ============================================================================
-- setup-all.sql  —  generated convenience file
--
-- Runs migrations 0001, 0002, 0003 and the seed data in one paste.
-- Paste the whole thing into the Supabase SQL Editor and hit Run.
--
-- Safe to run ONCE on a brand-new project. Re-running will error on the
-- CREATE TYPE / CREATE TABLE statements, which is intended: it stops you
-- accidentally wiping a database that already has real data in it.
-- ============================================================================

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

-- ============================================================================
-- 0002_admin_and_rls.sql
-- Admin allowlist + row-level security.
--
-- Admin allowlist: a small `admin_emails` table, not an env var, so it is a
-- single source of truth usable both by RLS policies (which run inside
-- Postgres and can't read Next.js env vars) and by the Next.js server (which
-- reads it via a service-role query in middleware). It's "hardcoded" in the
-- sense the spec means — there is no admin UI to manage it; adding an admin
-- means running SQL by hand. See README for how to add one.
--
-- The hard security requirement from the spec — applicants must never be able
-- to read `payouts.gross_amount` (or any payouts row at all) — is enforced
-- here at the RLS layer, not just by omitting it from UI queries.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Admin allowlist
-- ---------------------------------------------------------------------------
create table admin_emails (
  email text primary key
);

-- Seed your own admin email(s) here (also see supabase/seed.sql):
-- insert into admin_emails (email) values ('you@example.com');

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from admin_emails
    where email = (auth.jwt() ->> 'email')
  );
$$;

-- ---------------------------------------------------------------------------
-- Guard triggers — RLS is row-level, not column-level, so self-service updates
-- from applicants are further restricted here to specific columns/transitions.
-- ---------------------------------------------------------------------------

-- Applicants may edit their own profile fields, but never self-approve or
-- mark their own email verified.
create or replace function protect_applicant_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;

  new.id := old.id;
  new.user_id := old.user_id;
  new.status := old.status;
  new.email_verified := old.email_verified;
  new.created_at := old.created_at;
  return new;
end;
$$;

-- Exposed via RPC so the Next.js middleware can check admin status with a
-- single call, without granting direct table access to admin_emails.
grant execute on function is_admin() to authenticated, anon;

create trigger applicants_protect_admin_fields
  before update on applicants
  for each row
  execute function protect_applicant_admin_fields();

-- Applicants may only submit proof and flip active -> submitted; every other
-- field (payout amount, job/applicant linkage, paid_at, admin re-opens, etc.)
-- is admin-only.
create or replace function protect_assignment_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;

  new.id := old.id;
  new.job_id := old.job_id;
  new.applicant_id := old.applicant_id;
  new.applicant_payout_amount := old.applicant_payout_amount;
  new.assigned_at := old.assigned_at;
  new.paid_at := old.paid_at;

  if old.status = 'active' and new.status = 'submitted' then
    -- allowed applicant transition
  else
    new.status := old.status;
  end if;

  return new;
end;
$$;

create trigger assignments_protect_admin_fields
  before update on assignments
  for each row
  execute function protect_assignment_admin_fields();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table niches enable row level security;
alter table jobs enable row level security;
alter table applicants enable row level security;
alter table assignments enable row level security;
alter table payouts enable row level security;
alter table admin_emails enable row level security;

-- niches: public read, admin write
create policy niches_select_all on niches
  for select
  using (true);

create policy niches_admin_write on niches
  for all
  using (is_admin())
  with check (is_admin());

-- jobs: public read (job board is browsable without an account), admin write
create policy jobs_select_all on jobs
  for select
  using (true);

create policy jobs_admin_write on jobs
  for all
  using (is_admin())
  with check (is_admin());

-- applicants: owner can read/create/update their own row; admin sees all
create policy applicants_select_own_or_admin on applicants
  for select
  using (auth.uid() = user_id or is_admin());

create policy applicants_insert_own on applicants
  for insert
  with check (auth.uid() = user_id or is_admin());

create policy applicants_update_own_or_admin on applicants
  for update
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

create policy applicants_delete_admin on applicants
  for delete
  using (is_admin());

-- assignments: applicant sees/updates only their own; admin sees/manages all
create policy assignments_select_own_or_admin on assignments
  for select
  using (
    is_admin()
    or exists (
      select 1 from applicants
      where applicants.id = assignments.applicant_id
        and applicants.user_id = auth.uid()
    )
  );

create policy assignments_insert_admin on assignments
  for insert
  with check (is_admin());

create policy assignments_update_own_or_admin on assignments
  for update
  using (
    is_admin()
    or exists (
      select 1 from applicants
      where applicants.id = assignments.applicant_id
        and applicants.user_id = auth.uid()
    )
  )
  with check (
    is_admin()
    or exists (
      select 1 from applicants
      where applicants.id = assignments.applicant_id
        and applicants.user_id = auth.uid()
    )
  );

create policy assignments_delete_admin on assignments
  for delete
  using (is_admin());

-- payouts: admin only, full stop. No applicant-facing policy exists at all,
-- so PostgREST/Supabase will return an empty result (not an error) for any
-- non-admin request — gross_amount can never leave the server to an applicant.
create policy payouts_admin_only on payouts
  for all
  using (is_admin())
  with check (is_admin());

-- admin_emails: admins can read the allowlist (to render it, if ever needed);
-- no one can write it through the API — it's edited by direct SQL only.
create policy admin_emails_select_admin on admin_emails
  for select
  using (is_admin());

-- ============================================================================
-- 0003_applications_and_profile.sql
--
-- Adds the creator-initiated apply flow, and expands the applicant profile
-- into something that works as a resume / profile card.
--
-- Design decisions worth knowing about:
--
--   * `applications` is separate from `assignments`. An application is the
--     creator raising their hand for a specific job; an assignment is you
--     putting them on it. Keeping them apart means an application can be
--     declined without inventing a fake assignment, you can still assign
--     someone who never applied, and the two histories stay readable.
--
--   * Handles move to their own table, because a creator posts on more than
--     one platform. `applicants.handle` / `.platform` stay as the *primary*
--     handle, kept in sync by a trigger from the `is_primary` row — job
--     matching and every existing query still work off a single platform,
--     with no duplicated writes to drift apart.
--
--   * Education and experience are modelled for creators, not for office
--     workers: "years creating" and "brands worked with" tell you far more
--     than a degree does, and every field here is optional so a 19-year-old
--     with a good TikTok isn't filtered out by a form.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Profile fields
-- ---------------------------------------------------------------------------
alter table applicants
  add column username text unique,
  add column location text,
  add column languages text[] not null default '{}',
  add column education text,
  add column education_level text,
  add column years_creating numeric(3, 1),
  add column experience_summary text,
  add column brands_worked_with text[] not null default '{}',
  add column content_types text[] not null default '{}';

comment on column applicants.username is
  'Public profile identifier, distinct from their social handles.';
comment on column applicants.years_creating is
  'Self-reported years making content. Numeric so "0.5" is expressible.';

-- Usernames are public and used in URLs, so constrain the shape.
alter table applicants
  add constraint username_format check (
    username is null
    or username ~ '^[a-z0-9_]{3,30}$'
  );

-- ---------------------------------------------------------------------------
-- applicant_handles — one row per platform the creator posts on
-- ---------------------------------------------------------------------------
create table applicant_handles (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references applicants(id) on delete cascade,
  platform platform_enum not null,
  handle text not null,
  profile_url text,
  follower_count integer check (follower_count >= 0),
  is_primary boolean not null default false,
  -- Set by an admin after eyeballing the profile. There is no reliable way to
  -- verify handle ownership without platform API access, so this records a
  -- human check rather than pretending to be automated.
  verified_at timestamptz,
  created_at timestamptz not null default now(),

  -- Same creator can't list the same handle on the same platform twice.
  unique (applicant_id, platform, handle)
);

create index applicant_handles_applicant_idx on applicant_handles (applicant_id);

-- Exactly one primary handle per applicant.
create unique index applicant_handles_one_primary
  on applicant_handles (applicant_id)
  where is_primary;

-- Keep applicants.handle / .platform mirroring the primary row, so existing
-- matching and display queries keep working without a second write path.
create or replace function sync_primary_handle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_primary then
      update applicants set handle = '', platform = platform
      where id = old.applicant_id;
    end if;
    return old;
  end if;

  if new.is_primary then
    update applicants
    set handle = new.handle, platform = new.platform
    where id = new.applicant_id;
  end if;
  return new;
end;
$$;

create trigger applicant_handles_sync_primary
  after insert or update or delete on applicant_handles
  for each row
  execute function sync_primary_handle();

-- ---------------------------------------------------------------------------
-- applications — creator raises their hand for a specific job
-- ---------------------------------------------------------------------------
create type application_status_enum as enum (
  'pending',    -- waiting on you
  'accepted',   -- you took them on (usually alongside an assignment)
  'declined',   -- you passed
  'withdrawn'   -- creator pulled out
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  applicant_id uuid not null references applicants(id) on delete cascade,
  status application_status_enum not null default 'pending',
  -- Short pitch. The rest of the "resume" is their profile card, which is read
  -- live rather than snapshotted, so an updated profile improves old
  -- applications too.
  cover_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,

  -- One live application per creator per job.
  unique (job_id, applicant_id)
);

create index applications_job_idx on applications (job_id);
create index applications_applicant_idx on applications (applicant_id);
create index applications_status_idx on applications (status);

-- Applicants may withdraw their own application, but never accept it.
create or replace function protect_application_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;

  new.id := old.id;
  new.job_id := old.job_id;
  new.applicant_id := old.applicant_id;
  new.created_at := old.created_at;
  new.decided_at := old.decided_at;

  if old.status = 'pending' and new.status = 'withdrawn' then
    -- the one transition a creator is allowed
  else
    new.status := old.status;
  end if;

  return new;
end;
$$;

create trigger applications_protect_admin_fields
  before update on applications
  for each row
  execute function protect_application_admin_fields();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table applicant_handles enable row level security;
alter table applications enable row level security;

-- Handles: owner manages their own; admin sees all.
-- Note these are NOT publicly readable — a creator's platform handles are
-- personal data and only need to be visible to them and to you.
create policy applicant_handles_select_own_or_admin on applicant_handles
  for select
  using (
    is_admin()
    or exists (
      select 1 from applicants
      where applicants.id = applicant_handles.applicant_id
        and applicants.user_id = auth.uid()
    )
  );

create policy applicant_handles_write_own_or_admin on applicant_handles
  for all
  using (
    is_admin()
    or exists (
      select 1 from applicants
      where applicants.id = applicant_handles.applicant_id
        and applicants.user_id = auth.uid()
    )
  )
  with check (
    is_admin()
    or exists (
      select 1 from applicants
      where applicants.id = applicant_handles.applicant_id
        and applicants.user_id = auth.uid()
    )
  );

-- Applications: creator sees and creates their own; admin sees all.
create policy applications_select_own_or_admin on applications
  for select
  using (
    is_admin()
    or exists (
      select 1 from applicants
      where applicants.id = applications.applicant_id
        and applicants.user_id = auth.uid()
    )
  );

create policy applications_insert_own on applications
  for insert
  with check (
    is_admin()
    or exists (
      select 1 from applicants
      where applicants.id = applications.applicant_id
        and applicants.user_id = auth.uid()
        -- Only approved creators can apply; keeps the queue meaningful.
        and applicants.status = 'approved'
    )
  );

create policy applications_update_own_or_admin on applications
  for update
  using (
    is_admin()
    or exists (
      select 1 from applicants
      where applicants.id = applications.applicant_id
        and applicants.user_id = auth.uid()
    )
  )
  with check (
    is_admin()
    or exists (
      select 1 from applicants
      where applicants.id = applications.applicant_id
        and applicants.user_id = auth.uid()
    )
  );

create policy applications_delete_admin on applications
  for delete
  using (is_admin());

-- ---------------------------------------------------------------------------
-- Backfill: give every existing applicant a primary handle row.
-- ---------------------------------------------------------------------------
insert into applicant_handles (applicant_id, platform, handle, is_primary)
select id, platform, handle, true
from applicants
where handle <> ''
on conflict (applicant_id, platform, handle) do nothing;

-- ============================================================================
-- seed.sql
-- Run after migrations. Safe to re-run (uses ON CONFLICT DO NOTHING).
-- ============================================================================

-- Editable niche list (spec requires this be editable, not a hardcoded enum).
insert into niches (slug, label) values
  ('crypto', 'Crypto'),
  ('igaming', 'iGaming'),
  ('finance', 'Finance'),
  ('beauty', 'Beauty'),
  ('fitness', 'Fitness'),
  ('gaming', 'Gaming'),
  ('ecommerce', 'E-commerce'),
  ('other', 'Other')
on conflict (slug) do nothing;

-- ⚠️ ADMIN ACCESS — CHECK THIS LINE BEFORE YOU RUN.
-- Pre-filled with the email address on this machine's session. If you plan to
-- sign up with a different one, change it here first. This is the ONLY place
-- admin access is granted and there's no UI for it afterwards — you'd have to
-- come back and run another INSERT by hand.
insert into admin_emails (email) values
  ('azekir@york.citycollege.eu')
on conflict (email) do nothing;

-- A few sample jobs so /jobs isn't empty in local dev. Delete these once you
-- start entering real campaigns via /admin/jobs. `jobs.title` has no unique
-- constraint (two real campaigns could share a title), so idempotency here is
-- via NOT EXISTS on title rather than ON CONFLICT.
insert into jobs (title, description, platform, niche_id, payout_type, payout_amount, payout_notes, account_requirement, status)
select
  v.title, v.description, v.platform::platform_enum, n.id, v.payout_type::payout_type_enum, v.payout_amount, v.payout_notes, v.account_requirement::account_requirement_enum, v.status::job_status_enum
from (
  values
    ('Crypto exchange app walkthrough', 'Short-form walkthrough of a crypto trading app''s onboarding flow. Full brand details shared after assignment.', 'tiktok', 'crypto', 'flat', 150.00, 'Paid per approved video, 2 revisions included', 'new_ok', 'open'),
    ('Fitness app UGC testimonial', 'Casual talking-head testimonial about a fitness tracking app. Script guidance provided.', 'instagram', 'fitness', 'flat', 120.00, null, 'new_ok', 'open'),
    ('Online casino unboxing-style promo', 'Energetic promo-style short for an online gaming platform.', 'youtube_shorts', 'igaming', 'cpm', 8.00, 'CPM based on verified views, paid monthly', 'established_required', 'open'),
    ('Beauty subscription box review', 'Authentic review-style video for a monthly beauty box brand.', 'tiktok', 'beauty', 'flat', 90.00, null, 'new_ok', 'open')
) as v(title, description, platform, niche_slug, payout_type, payout_amount, payout_notes, account_requirement, status)
join niches n on n.slug = v.niche_slug
where not exists (select 1 from jobs j where j.title = v.title);
