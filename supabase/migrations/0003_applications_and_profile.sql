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
