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
