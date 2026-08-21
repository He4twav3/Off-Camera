-- ============================================================================
-- 0006_off_camera_profiles.sql
-- Training-domain identity: course progress + payment state.
--
-- Deliberately a separate table from `applicants` (0001), not new columns
-- bolted onto it. `profiles` is the training-domain identity every signed-up
-- user has from the moment they create an account; `applicants` is the
-- recruiting-domain identity, only created once someone actually applies
-- after completing the course (see the training->recruiting handoff). Keeping
-- them separate means `applicants`' existing RLS/triggers/is_admin() wiring
-- from 0001/0002 is untouched by anything below.
--
-- `paid` is the real gate on course access — set only by a confirmed payment
-- webhook (Dodo or NOWPayments), never by the client. The guard trigger below
-- enforces that the same way 0002's protect_applicant_admin_fields() protects
-- `applicants.status`.
-- ============================================================================

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  completed_lessons text[] not null default '{}',
  paid boolean not null default false,
  paid_at timestamptz,
  payment_provider text check (payment_provider in ('dodo', 'nowpayments')),
  payment_reference text,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

-- Payment webhooks/fulfillment run with no signed-in user and look a
-- profile up by email (Supabase's admin API has no direct
-- get-user-by-email call) — this index is the lookup path.
create index profiles_email_idx on profiles (email);

-- ---------------------------------------------------------------------------
-- Guard trigger — owners can edit their own display_name/completed_lessons,
-- but never their own paid/payment fields. Mirrors 0002's
-- protect_applicant_admin_fields() exactly.
-- ---------------------------------------------------------------------------
create or replace function protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;

  new.user_id := old.user_id;
  new.email := old.email;
  new.paid := old.paid;
  new.paid_at := old.paid_at;
  new.payment_provider := old.payment_provider;
  new.payment_reference := old.payment_reference;
  new.refunded_at := old.refunded_at;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger profiles_protect_admin_fields
  before update on profiles
  for each row
  execute function protect_profile_admin_fields();

-- ---------------------------------------------------------------------------
-- Auto-create the profile row on signup — same "one write, not a second
-- round-trip from the app" idea as any standard Supabase
-- create-profile-on-signup pattern.
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (user_id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

-- profiles: owner can read/update their own row; admin sees/manages all.
-- No public/anon read — course progress and payment state are private.
-- No insert policy: rows are only ever created by handle_new_user()
-- (security definer, bypasses RLS) or the service-role admin client
-- (ensureUser during payment fulfillment) — never directly by a client.
create policy profiles_select_own_or_admin on profiles
  for select
  using (auth.uid() = user_id or is_admin());

create policy profiles_update_own_or_admin on profiles
  for update
  using (auth.uid() = user_id or is_admin())
  with check (auth.uid() = user_id or is_admin());

create policy profiles_delete_admin on profiles
  for delete
  using (is_admin());
