-- ============================================================================
-- 0017_withdrawal_safeguards.sql   (run after 0016)
--
-- Hardens withdrawals:
--   * A creator must confirm each request from an emailed link.
--   * A hold before it can be paid: 72h for a first withdrawal or new payment
--     details, 24h otherwise. The hold starts when the request is confirmed.
--   * Limits: $2,000 per rolling 24h, 3 requests per hour, one unconfirmed
--     request at a time.
--   * Requests of $1,000 or more need a second, different admin: one approves,
--     another marks it paid.
--   * Admins can freeze a creator's withdrawals.
--   * Payment details are stored encrypted by the app and wiped once a request
--     is paid, rejected, cancelled or expired. Only the last 4 characters stay.
--   * Every admin action is written to admin_audit, with who did it.
--   * Money actions (crediting a balance, deciding or freezing withdrawals)
--     need an admin who has signed in with two-step verification (TOTP), checked
--     here in the database, not only in the pages.
--
-- The creator-facing functions can now be called only by the server (service
-- role), not from a creator's own login, so none of these checks can be
-- skipped by calling the database directly.
-- ============================================================================

-- ---- withdrawals: new columns and wider status list -----------------------

alter table withdrawals drop constraint if exists withdrawals_status_check;
alter table withdrawals drop constraint if exists withdrawals_payout_details_check;

alter table withdrawals
  add constraint withdrawals_status_check
    check (status in ('pending_confirmation', 'requested', 'paid', 'rejected', 'cancelled', 'expired')),
  -- Holds encrypted text while open (see lib/secret-box.ts), a short notice after.
  add constraint withdrawals_payout_details_check
    check (length(payout_details) between 5 and 1000);

alter table withdrawals
  add column details_last4        text,
  add column details_hash         text,
  add column account_holder_match boolean not null default false,
  add column hold_hours           integer not null default 72,
  add column confirm_token_hash   text,
  add column confirm_expires_at   timestamptz,
  add column confirmed_at         timestamptz,
  add column payable_after        timestamptz,
  add column approved_by          text,
  add column approved_at          timestamptz,
  add column decided_by           text,
  add column details_removed_at   timestamptz;

create index withdrawals_details_hash_idx on withdrawals (applicant_id, details_hash) where status = 'paid';

-- ---- two-step sign-in for money actions -----------------------------------

-- An admin whose current session passed two-step verification (aal2).
create or replace function is_admin_mfa()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select is_admin() and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;
grant execute on function is_admin_mfa() to authenticated;

-- Crediting a creator's balance is a money action.
drop policy if exists balance_entries_admin_insert on balance_entries;
create policy balance_entries_admin_insert on balance_entries
  for insert
  with check (is_admin_mfa());

-- ---- who did what ---------------------------------------------------------

alter table balance_entries
  add column created_by text default (auth.jwt() ->> 'email');

create table admin_audit (
  id          uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action      text not null,
  target_id   uuid,
  detail      text,
  created_at  timestamptz not null default now()
);
create index admin_audit_created_idx on admin_audit (created_at desc);
alter table admin_audit enable row level security;
create policy admin_audit_select on admin_audit for select using (is_admin());
-- No insert/update/delete policies: rows are written only by the functions below.

create table withdrawal_freezes (
  applicant_id uuid primary key references applicants(id) on delete cascade,
  reason       text,
  frozen_by    text not null,
  frozen_at    timestamptz not null default now()
);
alter table withdrawal_freezes enable row level security;
create policy withdrawal_freezes_select on withdrawal_freezes for select using (is_admin());

create or replace function log_admin_action(p_action text, p_target uuid default null, p_detail text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin_mfa() then raise exception 'forbidden'; end if;
  insert into admin_audit (admin_email, action, target_id, detail)
    values (auth.jwt() ->> 'email', p_action, p_target, p_detail);
end;
$$;

-- ---- creator actions (server only) ---------------------------------------

-- The old version could be called straight from a creator's login.
drop function if exists request_withdrawal(numeric, text);

create or replace function request_withdrawal(
  p_user_id     uuid,
  p_amount      numeric,
  p_cipher      text,
  p_last4       text,
  p_hash        text,
  p_holder      text,
  p_token_hash  text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant uuid;
  v_name      text;
  v_status    text;
  v_amount    numeric := round(p_amount, 2);
  v_balance   numeric;
  v_recent    numeric;
  v_id        uuid;
  v_hold      integer;
  v_match     boolean;
begin
  select id, name, status::text into v_applicant, v_name, v_status
    from applicants where user_id = p_user_id;
  if v_applicant is null then raise exception 'no_profile'; end if;
  if v_status <> 'approved' then raise exception 'not_approved'; end if;
  if exists (select 1 from withdrawal_freezes where applicant_id = v_applicant) then
    raise exception 'frozen';
  end if;

  if v_amount is null or v_amount < 10 then raise exception 'below_minimum'; end if;
  if length(coalesce(p_cipher, '')) < 5 or length(p_cipher) > 1000
     or coalesce(p_hash, '') = '' or coalesce(p_token_hash, '') = '' then
    raise exception 'bad_details';
  end if;

  -- One request at a time per creator, so the checks below are reliable.
  perform pg_advisory_xact_lock(hashtextextended(v_applicant::text, 0));

  if exists (select 1 from withdrawals where applicant_id = v_applicant and status = 'pending_confirmation') then
    raise exception 'already_pending';
  end if;
  if (select count(*) from withdrawals
        where applicant_id = v_applicant and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'too_many';
  end if;

  select coalesce(sum(amount), 0) into v_recent from withdrawals
    where applicant_id = v_applicant
      and status in ('pending_confirmation', 'requested', 'paid')
      and created_at > now() - interval '24 hours';
  if v_recent + v_amount > 2000 then raise exception 'daily_limit'; end if;

  select coalesce(sum(amount), 0) into v_balance from balance_entries where applicant_id = v_applicant;
  if v_amount > v_balance then raise exception 'insufficient_balance'; end if;

  -- 72h for a first withdrawal or details we have not paid before, else 24h.
  v_hold := case when exists (
      select 1 from withdrawals
       where applicant_id = v_applicant and status = 'paid' and details_hash = p_hash
    ) then 24 else 72 end;

  -- Does every part of the profile name appear in the account holder name?
  v_match := coalesce(trim(p_holder), '') <> '' and not exists (
    select 1 from regexp_split_to_table(lower(v_name), '\s+') as t
     where length(t) >= 2 and position(t in lower(p_holder)) = 0
  );

  insert into withdrawals (
    applicant_id, amount, status, payout_details, details_last4, details_hash,
    account_holder_match, hold_hours, confirm_token_hash, confirm_expires_at
  ) values (
    v_applicant, v_amount, 'pending_confirmation', p_cipher, left(coalesce(p_last4, ''), 4), p_hash,
    v_match, v_hold, p_token_hash, now() + interval '24 hours'
  ) returning id into v_id;

  insert into balance_entries (applicant_id, amount, kind, withdrawal_id, note)
    values (v_applicant, -v_amount, 'withdrawal', v_id, 'Withdrawal requested');

  return v_id;
end;
$$;

create or replace function confirm_withdrawal(p_user_id uuid, p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  w withdrawals%rowtype;
begin
  select wd.* into w
    from withdrawals wd
    join applicants a on a.id = wd.applicant_id
   where a.user_id = p_user_id
     and wd.status = 'pending_confirmation'
     and wd.confirm_token_hash = p_token_hash
   for update of wd;
  if not found or w.confirm_expires_at < now() then raise exception 'invalid_or_expired'; end if;

  update withdrawals
     set status = 'requested',
         confirmed_at = now(),
         payable_after = now() + make_interval(hours => w.hold_hours),
         confirm_token_hash = null
   where id = w.id;
  return w.id;
end;
$$;

create or replace function cancel_withdrawal(p_user_id uuid, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w withdrawals%rowtype;
begin
  select wd.* into w
    from withdrawals wd
    join applicants a on a.id = wd.applicant_id
   where wd.id = p_id and a.user_id = p_user_id
   for update of wd;
  if not found then raise exception 'not_found'; end if;
  if w.status not in ('pending_confirmation', 'requested') then raise exception 'already_decided'; end if;

  update withdrawals
     set status = 'cancelled', decided_at = now(), confirm_token_hash = null,
         payout_details = '[removed: cancelled]', details_removed_at = now()
   where id = w.id;
  insert into balance_entries (applicant_id, amount, kind, withdrawal_id, note)
    values (w.applicant_id, w.amount, 'adjustment', w.id, 'Withdrawal cancelled: returned to balance');
end;
$$;

-- Unconfirmed requests expire after 24h and the money goes back.
create or replace function expire_unconfirmed_withdrawals()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  w withdrawals%rowtype;
  n integer := 0;
begin
  for w in
    select * from withdrawals
     where status = 'pending_confirmation' and confirm_expires_at < now()
     for update
  loop
    update withdrawals
       set status = 'expired', decided_at = now(), confirm_token_hash = null,
           payout_details = '[removed: expired]', details_removed_at = now()
     where id = w.id;
    insert into balance_entries (applicant_id, amount, kind, withdrawal_id, note)
      values (w.applicant_id, w.amount, 'adjustment', w.id, 'Withdrawal expired: returned to balance');
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- ---- admin actions --------------------------------------------------------

drop function if exists decide_withdrawal(uuid, text, text, text);

create or replace function decide_withdrawal(
  p_id     uuid,
  p_action text,
  p_ref    text default null,
  p_note   text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w       withdrawals%rowtype;
  v_email text := auth.jwt() ->> 'email';
begin
  if not is_admin_mfa() or v_email is null then raise exception 'forbidden'; end if;
  if p_action not in ('approve', 'paid', 'rejected') then raise exception 'bad_action'; end if;

  select * into w from withdrawals where id = p_id for update;
  if not found then raise exception 'not_found'; end if;

  if p_action = 'rejected' then
    if w.status not in ('pending_confirmation', 'requested') then raise exception 'already_decided'; end if;
    update withdrawals
       set status = 'rejected', admin_note = nullif(trim(p_note), ''), decided_at = now(),
           decided_by = v_email, confirm_token_hash = null,
           payout_details = '[removed: rejected]', details_removed_at = now()
     where id = p_id;
    insert into balance_entries (applicant_id, amount, kind, withdrawal_id, note)
      values (w.applicant_id, w.amount, 'adjustment', w.id, 'Withdrawal rejected: returned to balance');
    insert into admin_audit (admin_email, action, target_id, detail)
      values (v_email, 'withdrawal_rejected', p_id, nullif(trim(p_note), ''));
    return;
  end if;

  -- approve / paid both need a confirmed request.
  if w.status <> 'requested' then raise exception 'already_decided'; end if;

  if p_action = 'approve' then
    if w.approved_by is not null then raise exception 'already_approved'; end if;
    update withdrawals set approved_by = v_email, approved_at = now() where id = p_id;
    insert into admin_audit (admin_email, action, target_id) values (v_email, 'withdrawal_approved', p_id);
    return;
  end if;

  -- paid
  if exists (select 1 from withdrawal_freezes where applicant_id = w.applicant_id) then
    raise exception 'frozen';
  end if;
  if w.payable_after is null or now() < w.payable_after then raise exception 'on_hold'; end if;
  if w.amount >= 1000 and (w.approved_by is null or w.approved_by = v_email) then
    raise exception 'needs_second_approval';
  end if;

  update withdrawals
     set status = 'paid', paid_ref = nullif(trim(p_ref), ''), admin_note = nullif(trim(p_note), ''),
         decided_at = now(), decided_by = v_email,
         payout_details = '[removed after payment]', details_removed_at = now()
   where id = p_id;
  insert into admin_audit (admin_email, action, target_id, detail)
    values (v_email, 'withdrawal_paid', p_id, nullif(trim(p_ref), ''));
end;
$$;

create or replace function freeze_withdrawals(p_applicant uuid, p_frozen boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := auth.jwt() ->> 'email';
begin
  if not is_admin_mfa() or v_email is null then raise exception 'forbidden'; end if;
  if p_frozen then
    insert into withdrawal_freezes (applicant_id, reason, frozen_by)
      values (p_applicant, nullif(trim(p_reason), ''), v_email)
      on conflict (applicant_id) do update set reason = excluded.reason, frozen_by = excluded.frozen_by, frozen_at = now();
  else
    delete from withdrawal_freezes where applicant_id = p_applicant;
  end if;
  insert into admin_audit (admin_email, action, target_id, detail)
    values (v_email, case when p_frozen then 'withdrawals_frozen' else 'withdrawals_unfrozen' end, p_applicant, nullif(trim(p_reason), ''));
end;
$$;

-- ---- who may call what ----------------------------------------------------

revoke all on function request_withdrawal(uuid, numeric, text, text, text, text, text) from public, anon, authenticated;
revoke all on function confirm_withdrawal(uuid, text) from public, anon, authenticated;
revoke all on function cancel_withdrawal(uuid, uuid) from public, anon, authenticated;
revoke all on function expire_unconfirmed_withdrawals() from public, anon, authenticated;
grant execute on function request_withdrawal(uuid, numeric, text, text, text, text, text) to service_role;
grant execute on function confirm_withdrawal(uuid, text) to service_role;
grant execute on function cancel_withdrawal(uuid, uuid) to service_role;
grant execute on function expire_unconfirmed_withdrawals() to service_role;

revoke all on function decide_withdrawal(uuid, text, text, text) from public, anon;
revoke all on function freeze_withdrawals(uuid, boolean, text) from public, anon;
revoke all on function log_admin_action(text, uuid, text) from public, anon;
grant execute on function decide_withdrawal(uuid, text, text, text) to authenticated;
grant execute on function freeze_withdrawals(uuid, boolean, text) to authenticated;
grant execute on function log_admin_action(text, uuid, text) to authenticated;
