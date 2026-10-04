-- ============================================================================
-- 0010_protect_handle_verification.sql
--
-- `applicant_handles.verified_at` means "this account is really theirs" — a
-- bio-code check passed, or an admin confirmed it. But the write policy lets a
-- creator update ANY column of their own handles, so until now they could set
-- verified_at themselves. This trigger makes the column write-protected: only
-- an admin or the service role (the server-side verification check) can set or
-- change it; anyone else's value is silently reset.
-- ============================================================================

create or replace function protect_handle_verified_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() or auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified_at := null;
  elsif new.verified_at is distinct from old.verified_at then
    new.verified_at := old.verified_at;
  end if;
  return new;
end;
$$;

create trigger applicant_handles_protect_verified
  before insert or update on applicant_handles
  for each row
  execute function protect_handle_verified_at();
