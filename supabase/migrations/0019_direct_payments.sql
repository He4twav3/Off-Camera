-- ============================================================================
-- 0019_direct_payments.sql
--
-- Direct payment: the brand pays each creator itself (bank transfer, PayPal,
-- Wise...). The platform only counts the views, works out what each creator is
-- owed, issues a statement, and records who says it has been paid. No creator
-- money ever passes through us, so there is nothing to hold or withdraw.
--
--   direct_payments   one statement per assignment: the amount owed, the due
--                     date, when the brand says it paid, when the creator
--                     confirms receipt (or reports not being paid), and our own
--                     fee (admin-only bookkeeping, separate from the creator's pay).
--
-- Admin-only under RLS, exactly like `payouts`: our fee must never reach a
-- creator or a brand. Creators and brands read their own statements through
-- server code that selects safe columns and checks ownership explicitly.
-- ============================================================================

-- How the creator wants the brand to pay them (IBAN, or the email on their
-- PayPal/Wise). The creator edits it on their own row; shown only to the brand
-- that owes them money. Never a card number (the app also checks this).
alter table applicants
  add column payout_instructions text
    check (payout_instructions is null or length(payout_instructions) between 5 and 200);

create table direct_payments (
  id                    uuid primary key default gen_random_uuid(),
  assignment_id         uuid not null unique references assignments (id) on delete restrict,
  amount                numeric(12,2) not null check (amount > 0),
  issued_at             timestamptz not null default now(),
  due_at                timestamptz not null,
  -- The brand's side: it says it paid, how, and an optional reference.
  brand_paid_at         timestamptz,
  brand_method          text check (brand_method is null or length(brand_method) <= 60),
  brand_reference       text check (brand_reference is null or length(brand_reference) <= 200),
  -- The creator's side: the real proof. Either they received it, or they say not.
  creator_confirmed_at  timestamptz,
  creator_disputed_at   timestamptz,
  creator_dispute_note  text check (creator_dispute_note is null or length(creator_dispute_note) <= 500),
  -- Admin-only: what we charge the brand for the service, and whether it arrived.
  our_fee               numeric(12,2) not null default 0 check (our_fee >= 0),
  fee_received_at       timestamptz,
  created_at            timestamptz not null default now(),
  -- A statement is either confirmed or disputed, never both at once.
  constraint direct_payments_not_both
    check (creator_confirmed_at is null or creator_disputed_at is null)
);

create index direct_payments_due_idx on direct_payments (due_at)
  where creator_confirmed_at is null;

alter table direct_payments enable row level security;

create policy direct_payments_admin_only on direct_payments
  for all
  using (is_admin())
  with check (is_admin());
