-- ============================================================================
-- Fix: protect_profile_admin_fields() only let is_admin() (a *signed-in
-- admin's own session*) through — but every real caller of markUserPaid()
-- (Dodo/NOWPayments webhooks, fulfillPurchase) uses the service-role admin
-- client with no user JWT at all. auth.jwt() ->> 'email' is null in that
-- context, so is_admin() returned false and the trigger silently reverted
-- paid/paid_at/payment_provider/payment_reference/refunded_at back to their
-- old values on every webhook write — real payments would never actually
-- mark an account paid. Confirmed live: a service-role update returned no
-- error but the row didn't change.
--
-- Fix: also let the service-role Postgres role through. The service-role
-- key is itself a JWT with role=service_role in its payload, so
-- auth.role() (backed by request.jwt.claim.role) reliably reads that even
-- with no user impersonated — this is the standard Supabase idiom for
-- "let the admin/service client bypass a trigger the way it already
-- bypasses RLS."
-- ============================================================================

create or replace function protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() or auth.role() = 'service_role' then
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
