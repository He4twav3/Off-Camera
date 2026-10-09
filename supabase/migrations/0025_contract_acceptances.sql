-- ============================================================================
-- 0025: contract acceptances. When a creator joins a campaign whose brand has signed its
-- contract, the creator ticks "I agree to the contract" and this records it: who, when, and
-- which version of the contract (the date the brand agreed to it).
--
-- The site works without this table (joining still needs the tick, it just isn't recorded,
-- and the admin home says "Setup needed"), so it is safe to run before or after the code.
-- Only the service role writes it (the join action); admins can read it.
-- ============================================================================

create table if not exists contract_acceptances (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references assignments(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  applicant_id uuid not null references applicants(id) on delete cascade,
  accepted_at timestamptz not null default now(),
  -- When the brand agreed to the version the creator accepted.
  contract_agreed_at timestamptz
);

alter table contract_acceptances enable row level security;

drop policy if exists contract_acceptances_admin_read on contract_acceptances;
create policy contract_acceptances_admin_read on contract_acceptances
  for select using (is_admin());
