# Withdrawals: how it works and how it is protected

Brands pay us. A creator's share is credited to their **balance** when an admin
releases the payout (Admin → Payouts). The creator then requests a
**withdrawal** (Earnings page), and an admin pays it by bank transfer (Wise or
SEPA) and marks it paid (Admin → Withdrawals).

## Safeguards in place

| Risk | Safeguard |
|---|---|
| Someone in a stolen creator account withdraws | Each request must be confirmed from an emailed link. Opening the link isn't enough: the creator presses a button. Unconfirmed requests expire after 24h and the money returns. |
| Quick theft after takeover | A hold before payment: 72h for a first withdrawal or new payment details, 24h otherwise. The creator can cancel any time before it's paid. |
| Draining a balance | $2,000 per rolling 24h, 3 requests per hour, one unconfirmed request at a time. |
| A stolen admin login | Money actions (crediting balances, approving, paying, freezing) need two-step sign-in (TOTP), checked in the database. Requests of $1,000 or more need one admin to approve and a **different** admin to mark paid. Every action is logged with who did it (Admin → Withdrawals, "Recent admin activity"). |
| Leaked bank details | We never collect them. Creators enter only an email address; Wise emails them a secure link to enter their bank details themselves. The email is stored encrypted (AES-256-GCM) with a key that lives only in the server environment, hidden in lists, revealing it is logged, and it is wiped when a request is paid, rejected, cancelled or expired (only the first 4 characters stay). |
| Wrong name on an account | The account-holder name is compared with the profile name; a mismatch is flagged to the admin. |
| Suspected fraud | An admin can freeze one creator's withdrawals. |
| Bad bookkeeping | "Books check" on the Withdrawals page: payouts released = credits, and balances = credits − withdrawals. A mismatch is shown in red. |
| Skipping the rules | The creator-facing database functions can only be called by the server, not from a creator's own login. The ledger is append-only. |

## Setup

1. Run `0016_creator_balance.sql`, then `0017_withdrawal_safeguards.sql` in the Supabase SQL editor.
2. Generate a key with `openssl rand -base64 32` and set it as `WITHDRAWAL_DETAILS_KEY` in Vercel
   (Production). Keep a copy in a password manager. Without it, withdrawals refuse to run.
3. In Supabase → Authentication, make sure TOTP / multi-factor is enabled.
4. Each admin opens **Admin → Security** once to set up their authenticator app.
5. Turn on two-step sign-in for Supabase, Vercel, GitHub, Google and Wise as well.

## Paying a withdrawal

1. Admin → Withdrawals. Check the name-match flag and the hold ("Ready to pay").
2. For $1,000 or more: one admin presses **Approve**; a different admin does the rest.
3. Press **Show details (logged)**. In Wise choose Send money, then send by email to that
   address (Wise asks the creator for their bank details; they have 7 days to claim it).
   Send it from the separate creator-money account, then **Mark paid** with the transfer
   reference. The creator is emailed and the email is wiped.

## Tests

`python3 scripts/test-withdrawals-sql.py` runs the SQL against a throwaway Postgres.
