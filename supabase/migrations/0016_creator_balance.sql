-- ============================================================================
-- 0016_creator_balance.sql
--
-- Creator balances and withdrawals.
--
-- Brands pay us; a creator's share is credited to their balance once an admin
-- releases it (after the brand has paid), and the creator then requests a
-- withdrawal that an admin pays by bank transfer. Everything is recorded in an
-- append-only ledger, so a balance is always just the sum of its entries.
--
--   balance_entries   +earning (released payout), -withdrawal (taken the moment
--                     it is requested), +adjustment (rejected request returned)
--   withdrawals       the requests: requested -> paid | rejected
--
-- Creators can read their own rows. They cannot write to either table directly;
-- requests go through request_withdrawal(), which checks the balance under a
-- per-creator lock so two quick requests cannot overdraw it. Admin decisions go
-- through decide_withdrawal().
-- ============================================================================

create table withdrawals (
  id             uuid primary key default gen_random_uuid(),
  applicant_id   uuid not null references applicants(id) on delete restrict,
  amount         numeric(12,2) not null check (amount > 0),
  status         text not null default 'requested'
                   check (status in ('requested', 'paid', 'rejected')),
  -- How the creator wants to be paid (IBAN, or the email on their Wise/PayPal).
  -- Sensitive: readable only by the creator and admins.
  payout_details text not null check (length(payout_details) between 5 and 300),
  paid_ref       text,
  admin_note     text,
  created_at     timestamptz not null default now(),
  decided_at     timestamptz
);

create table balance_entries (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references applicants(id) on delete restrict,
  amount        numeric(12,2) not null check (amount <> 0),
  kind          text not null check (kind in ('earning', 'withdrawal', 'adjustment')),
  -- An assignment can be credited once only (NULLs do not clash).
  assignment_id uuid unique references assignments(id) on delete restrict,
  withdrawal_id uuid references withdrawals(id) on delete restrict,
  note          text,
  created_at    timestamptz not null default now()
);

create index balance_entries_applicant_idx on balance_entries (applicant_id, created_at desc);
create index withdrawals_applicant_idx on withdrawals (applicant_id, created_at desc);
create index withdrawals_status_idx on withdrawals (status, created_at);

alter table withdrawals enable row level security;
alter table balance_entries enable row level security;

create policy withdrawals_select on withdrawals
  for select
  using (
    is_admin()
    or applicant_id in (select id from applicants where user_id = auth.uid())
  );

create policy balance_entries_select on balance_entries
  for select
  using (
    is_admin()
    or applicant_id in (select id from applicants where user_id = auth.uid())
  );

-- Admins record credits and adjustments. Nobody can update or delete entries
-- (no policy), so the ledger is append-only.
create policy balance_entries_admin_insert on balance_entries
  for insert
  with check (is_admin());

-- ---------------------------------------------------------------------------
-- A creator asks to withdraw. Returns the new withdrawal's id.
-- ---------------------------------------------------------------------------
create or replace function request_withdrawal(p_amount numeric, p_details text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant uuid;
  v_status    text;
  v_balance   numeric;
  v_amount    numeric := round(p_amount, 2);
  v_details   text := trim(coalesce(p_details, ''));
  v_id        uuid;
begin
  select id, status::text into v_applicant, v_status
    from applicants where user_id = auth.uid();
  if v_applicant is null then raise exception 'no_profile'; end if;
  if v_status <> 'approved' then raise exception 'not_approved'; end if;

  if v_amount is null or v_amount < 10 then raise exception 'below_minimum'; end if;
  if length(v_details) < 5 or length(v_details) > 300 then raise exception 'bad_details'; end if;

  -- One request at a time per creator, so the balance check below is reliable.
  perform pg_advisory_xact_lock(hashtextextended(v_applicant::text, 0));

  select coalesce(sum(amount), 0) into v_balance
    from balance_entries where applicant_id = v_applicant;
  if v_amount > v_balance then raise exception 'insufficient_balance'; end if;

  insert into withdrawals (applicant_id, amount, payout_details)
    values (v_applicant, v_amount, v_details)
    returning id into v_id;

  insert into balance_entries (applicant_id, amount, kind, withdrawal_id, note)
    values (v_applicant, -v_amount, 'withdrawal', v_id, 'Withdrawal requested');

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- An admin pays or rejects a request. A rejection returns the money.
-- ---------------------------------------------------------------------------
create or replace function decide_withdrawal(
  p_id uuid,
  p_action text,
  p_ref text default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w withdrawals%rowtype;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_action not in ('paid', 'rejected') then raise exception 'bad_action'; end if;

  select * into w from withdrawals where id = p_id for update;
  if not found then raise exception 'not_found'; end if;
  if w.status <> 'requested' then raise exception 'already_decided'; end if;

  update withdrawals
     set status = p_action,
         paid_ref = case when p_action = 'paid' then nullif(trim(p_ref), '') else null end,
         admin_note = nullif(trim(p_note), ''),
         decided_at = now()
   where id = p_id;

  if p_action = 'rejected' then
    insert into balance_entries (applicant_id, amount, kind, withdrawal_id, note)
      values (w.applicant_id, w.amount, 'adjustment', w.id, 'Withdrawal rejected: returned to balance');
  end if;
end;
$$;

revoke all on function request_withdrawal(numeric, text) from public, anon;
revoke all on function decide_withdrawal(uuid, text, text, text) from public, anon;
grant execute on function request_withdrawal(numeric, text) to authenticated;
grant execute on function decide_withdrawal(uuid, text, text, text) to authenticated;
