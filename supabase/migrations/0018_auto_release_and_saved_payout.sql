-- ============================================================================
-- 0018_auto_release_and_saved_payout.sql   (run after 0017)
--
-- 1. Automatic release of earnings
--    An admin approves a creator's post (one click). From then on the server
--    releases the creator's earnings to their balance by itself, once the
--    brand has paid and (for view-based pay) the measurement window has ended.
--    Money still leaves only when an admin sends the bank transfer.
--      * assignments.submitted_at  set by the database when a post is submitted
--      * assignments.approved_at/by  set only by approve_assignment()
--      * release_earning()  the only way the server credits a balance
--        automatically; it refuses to credit more than the brand paid
--      * balance_entries.stage  an assignment can be credited in stages
--        ('fixed' then 'rest') or once ('full'); each stage only once
--
-- 2. Saved payout email
--    A creator saves a payout email once. A withdrawal to an email we have
--    already paid successfully is confirmed automatically (24h hold); a new or
--    changed email still needs the emailed confirmation and the 72h hold, so a
--    stolen session can't redirect money to a new destination.
-- ============================================================================

-- ---- assignments: when submitted, when approved, by whom ------------------

alter table assignments
  add column submitted_at timestamptz,
  add column approved_at  timestamptz,
  add column approved_by  text;

-- Best guess for posts submitted before this existed.
update assignments set submitted_at = assigned_at
 where status in ('submitted', 'paid') and submitted_at is null;

-- The existing guard reverts non-admin edits to protected fields. The server's
-- own release step (running as the service role, not as an admin) must be able
-- to mark an assignment paid, so definer functions raise a flag for the
-- duration of their own transaction. Nothing a client can send sets this flag.
create or replace function protect_assignment_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() or coalesce(current_setting('app.system_write', true), '') = 'on' then
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

-- submitted_at is stamped by the database on the status change and can't be
-- edited; approved_at/by change only inside approve_assignment(). Named so it
-- runs after the guard above (triggers run in name order).
create or replace function zz_assignment_system_fields()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    new.submitted_at := now();
  else
    new.submitted_at := old.submitted_at;
  end if;

  if coalesce(current_setting('app.system_write', true), '') <> 'on' then
    new.approved_at := old.approved_at;
    new.approved_by := old.approved_by;
  end if;
  return new;
end;
$$;

create trigger zz_assignment_system_fields
  before update on assignments
  for each row execute function zz_assignment_system_fields();

-- ---- ledger: stages, and never credit more than the brand paid ------------

alter table balance_entries add column stage text not null default 'full'
  check (stage in ('fixed', 'rest', 'full'));

alter table balance_entries drop constraint if exists balance_entries_assignment_id_key;
alter table balance_entries add constraint balance_entries_assignment_stage_key unique (assignment_id, stage);

create or replace function check_earning_within_funded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gross numeric;
  v_sum   numeric;
begin
  if new.kind = 'earning' and new.assignment_id is not null then
    select gross_amount into v_gross from payouts where assignment_id = new.assignment_id;
    select coalesce(sum(amount), 0) into v_sum
      from balance_entries where assignment_id = new.assignment_id and kind = 'earning';
    if v_gross is null or v_sum + new.amount > v_gross then
      raise exception 'exceeds_funded';
    end if;
  end if;
  return new;
end;
$$;

create trigger balance_entries_check_funded
  before insert on balance_entries
  for each row execute function check_earning_within_funded();

-- ---- admin: approve a post (one click, needs two-step sign-in) ------------

create or replace function approve_assignment(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a       assignments%rowtype;
  v_email text := auth.jwt() ->> 'email';
begin
  if not is_admin_mfa() or v_email is null then raise exception 'forbidden'; end if;

  select * into a from assignments where id = p_id for update;
  if not found then raise exception 'not_found'; end if;
  if a.status <> 'submitted' then raise exception 'not_submitted'; end if;
  if a.approved_at is not null then raise exception 'already_approved'; end if;

  perform set_config('app.system_write', 'on', true);
  update assignments set approved_at = now(), approved_by = v_email where id = p_id;
  insert into admin_audit (admin_email, action, target_id) values (v_email, 'post_approved', p_id);
end;
$$;

-- ---- server: release earnings to a balance --------------------------------

create or replace function release_earning(
  p_assignment uuid,
  p_stage      text,
  p_amount     numeric,
  p_final      boolean,
  p_note       text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  a          assignments%rowtype;
  p          payouts%rowtype;
  v_released numeric;
  v_rows     integer;
  v_amount   numeric := round(p_amount, 2);
begin
  if p_stage not in ('fixed', 'rest', 'full') then raise exception 'bad_stage'; end if;
  if v_amount is null or v_amount <= 0 then raise exception 'bad_amount'; end if;

  select * into a from assignments where id = p_assignment for update;
  if not found then raise exception 'not_found'; end if;
  if a.status <> 'submitted' then raise exception 'not_submitted'; end if;
  if a.approved_at is null then raise exception 'not_approved'; end if;

  select * into p from payouts where assignment_id = p_assignment for update;
  if not found or p.brand_paid_at is null then raise exception 'not_funded'; end if;

  -- Asked twice for the same stage (a retry or a second run): nothing to do.
  if exists (select 1 from balance_entries where assignment_id = p_assignment and stage = p_stage) then
    return false;
  end if;

  select coalesce(sum(amount), 0) into v_released
    from balance_entries where assignment_id = p_assignment and kind = 'earning';
  if v_released + v_amount > p.gross_amount then raise exception 'exceeds_funded'; end if;

  insert into balance_entries (applicant_id, amount, kind, assignment_id, stage, note)
    values (a.applicant_id, v_amount, 'earning', p_assignment, p_stage, p_note)
    on conflict (assignment_id, stage) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return false; end if;

  if p_final then
    perform set_config('app.system_write', 'on', true);
    update assignments set status = 'paid', paid_at = now() where id = p_assignment;
    update payouts set paid_at = now() where assignment_id = p_assignment;
  end if;

  insert into admin_audit (admin_email, action, target_id, detail)
    values ('system:auto-release', 'earning_released', p_assignment, p_stage || ' ' || v_amount::text);
  return true;
end;
$$;

-- ---- saved payout email ---------------------------------------------------

create table payout_destinations (
  applicant_id uuid primary key references applicants(id) on delete cascade,
  cipher       text not null check (length(cipher) between 5 and 1000),
  hash         text not null,
  hint         text not null,
  holder       text not null,
  updated_at   timestamptz not null default now()
);
-- Row-level security on with no policies: only the server (service role) reads or writes it.
alter table payout_destinations enable row level security;

-- A withdrawal to an email we have already paid successfully is confirmed on the
-- spot (24h hold). Anything else keeps the emailed confirmation and 72h hold.
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
  v_trusted   boolean;
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

  v_trusted := coalesce(p_hash, '') <> '' and exists (
    select 1 from withdrawals
     where applicant_id = v_applicant and status = 'paid' and details_hash = p_hash
  );

  if length(coalesce(p_cipher, '')) < 5 or length(p_cipher) > 1000
     or coalesce(p_hash, '') = ''
     or (not v_trusted and coalesce(p_token_hash, '') = '') then
    raise exception 'bad_details';
  end if;

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

  v_match := coalesce(trim(p_holder), '') <> '' and not exists (
    select 1 from regexp_split_to_table(lower(v_name), '\s+') as t
     where length(t) >= 2 and position(t in lower(p_holder)) = 0
  );

  if v_trusted then
    insert into withdrawals (
      applicant_id, amount, status, payout_details, details_last4, details_hash,
      account_holder_match, hold_hours, confirmed_at, payable_after
    ) values (
      v_applicant, v_amount, 'requested', p_cipher, left(coalesce(p_last4, ''), 4), p_hash,
      v_match, 24, now(), now() + interval '24 hours'
    ) returning id into v_id;
  else
    insert into withdrawals (
      applicant_id, amount, status, payout_details, details_last4, details_hash,
      account_holder_match, hold_hours, confirm_token_hash, confirm_expires_at
    ) values (
      v_applicant, v_amount, 'pending_confirmation', p_cipher, left(coalesce(p_last4, ''), 4), p_hash,
      v_match, 72, p_token_hash, now() + interval '24 hours'
    ) returning id into v_id;
  end if;

  insert into balance_entries (applicant_id, amount, kind, withdrawal_id, note)
    values (v_applicant, -v_amount, 'withdrawal', v_id, 'Withdrawal requested');

  return v_id;
end;
$$;

-- ---- who may call what ----------------------------------------------------

revoke all on function release_earning(uuid, text, numeric, boolean, text) from public, anon, authenticated;
grant execute on function release_earning(uuid, text, numeric, boolean, text) to service_role;

revoke all on function approve_assignment(uuid) from public, anon;
grant execute on function approve_assignment(uuid) to authenticated;

revoke all on function request_withdrawal(uuid, numeric, text, text, text, text, text) from public, anon, authenticated;
grant execute on function request_withdrawal(uuid, numeric, text, text, text, text, text) to service_role;
