-- ============================================================================
-- 0026: the OnCamera fee for each campaign, set per brand contract.
--
-- Kept in its own admin-only table (not in the campaign's pay terms) because creators and brands can read
-- campaigns, and the fee is between OnCamera and the brand. It is a percentage on top of creator pay, in bands of the
-- campaign's cumulative creator pay, e.g. [{"upTo":5000,"percent":25},{"upTo":20000,"percent":20},{"upTo":null,"percent":15}].
--
-- The site works without this table (the fee on a statement is then simply typed in by hand), so it is safe to run
-- before or after the code that uses it.
-- ============================================================================

create table if not exists campaign_fees (
  job_id uuid primary key references jobs(id) on delete cascade,
  bands jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table campaign_fees enable row level security;

drop policy if exists campaign_fees_admin_all on campaign_fees;
create policy campaign_fees_admin_all on campaign_fees
  for all using (is_admin()) with check (is_admin());
