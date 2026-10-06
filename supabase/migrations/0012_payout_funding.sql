-- ============================================================================
-- 0012_payout_funding.sql
--
-- "Funded before payable". A creator can only be marked paid once the brand's
-- money for that assignment has arrived. Recorded on the (admin-only) payouts
-- row: when the brand's payment arrived and an optional reference (invoice or
-- transfer id).
--
-- The CHECK is NOT VALID on purpose: it applies to every new or changed row,
-- but doesn't fail on older payout rows that were marked paid before this
-- column existed.
-- ============================================================================

alter table payouts
  add column brand_paid_at timestamptz,
  add column brand_payment_ref text;

alter table payouts
  add constraint payouts_paid_needs_funding
  check (paid_at is null or brand_paid_at is not null)
  not valid;
