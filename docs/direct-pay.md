# Direct payment: brands pay creators themselves

Until there is a legal entity that can hold funds, the platform never touches
creator money. The brand pays each creator directly (bank transfer, PayPal,
Wise). The platform counts the views, works out what is owed, and keeps the
record of who says it has been paid.

## The flow

1. A creator submits their post. It appears on **Admin → Statements** as
   "Ready for a statement", with the amount the campaign's formula gives at the
   views so far.
2. The admin issues a statement: the amount the brand owes the creator, **our
   fee** (admin-only), and how many days the brand has (default 14). The creator
   and the brand are both emailed.
3. The creator has put **how they want to be paid** (PayPal/Wise email or IBAN)
   on their Earnings page. The brand sees it on its dashboard, next to the
   statement, and only for creators it owes.
4. The brand pays the creator itself, then clicks **Mark as paid** (how, and an
   optional reference). The creator is emailed to confirm.
5. The creator clicks **I received this payment**, or **I haven't been paid**
   (allowed once the brand says it paid, or the due date has passed). A report
   shows under "Needs attention" on the admin page.

The creator's word closes a statement. A statement is paid when the creator
confirms, whatever the brand clicked.

## Our own fee

Entered when the statement is issued, tracked with a "received" tick, and
invoiced to the brand outside the app. It lives only in `direct_payments`, which
is admin-only under RLS. Creators and brands read statements through
`lib/direct-pay-data.ts`, which never selects the fee columns.

## What is switched off

`PAYMENT_MODE` decides. Unset (or anything but `platform`) means direct payment:

- Earnings page shows statements instead of a balance and withdrawals.
- Admin shows **Statements** instead of **Payouts** and **Withdrawals**.
- Requesting a withdrawal is refused on the server.

Set `PAYMENT_MODE=platform` in Vercel to bring the balance system back once there
is an entity to hold funds. Nothing was deleted.

## Before this goes live

Run `supabase/migrations/0019_direct_payments.sql` in the Supabase SQL editor
**first**. Without it the Statements pages come up empty. It adds one column
(`applicants.payout_instructions`) and one table (`direct_payments`).

## Not built yet

- Automatic reminders to a brand when a statement is overdue (today the admin
  sees "Overdue" and chases by hand).
- An email to admins when a creator reports not being paid.
- Per-post statements for campaigns with several videos (one statement per
  creator per campaign for now).
