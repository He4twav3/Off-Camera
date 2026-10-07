-- ============================================================================
-- 0020_require_mfa_for_admins.sql
--
-- Make the authenticator code mandatory for admins IN THE DATABASE, on every
-- table, not only for money actions.
--
-- Before this, only withdrawals and balance credits needed a session that had
-- passed two-step sign-in (is_admin_mfa). Everything else (creators, brands,
-- applications, jobs, statements and our fees...) was protected by "this email
-- is on the admin list" alone, and the two-step code was checked only by the
-- website's pages. Supabase's login service is public, so someone holding just
-- an admin's password could sign in there and read or change all of that through
-- the database API without ever touching the website.
--
-- A RESTRICTIVE policy is ANDed with every other policy on the table. This one
-- says: if the signed-in account is on the admin list, its session must have
-- passed two-step sign-in (aal2). Everyone else (creators, brands, visitors) is
-- untouched, and the server's service role bypasses RLS as before.
--
-- A new table needs the rule too: call `select enforce_admin_mfa();` after
-- creating it (the test in scripts/test-admin-mfa-sql.py fails if one is missed).
--
-- If an admin is ever locked out because their authenticator is lost, remove
-- their factor in Supabase (Authentication > Users > the user > remove the
-- factor), then they enrol a new one at /admin/security.
-- ============================================================================

create or replace function enforce_admin_mfa()
returns void
language plpgsql
as $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity
  loop
    execute format('drop policy if exists require_mfa_for_admins on public.%I', t.relname);
    execute format(
      'create policy require_mfa_for_admins on public.%I as restrictive for all to authenticated '
      || 'using (not (select public.is_admin()) or (select public.is_admin_mfa())) '
      || 'with check (not (select public.is_admin()) or (select public.is_admin_mfa()))',
      t.relname
    );
  end loop;
end;
$$;

revoke all on function enforce_admin_mfa() from public, anon, authenticated;

select enforce_admin_mfa();

-- Sample videos live in storage, whose read policy for admins is also "on the list".
drop policy if exists require_mfa_for_admins on storage.objects;
create policy require_mfa_for_admins on storage.objects
  as restrictive
  for all
  to authenticated
  using (not (select public.is_admin()) or (select public.is_admin_mfa()))
  with check (not (select public.is_admin()) or (select public.is_admin_mfa()));
