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
