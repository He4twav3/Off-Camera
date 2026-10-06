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
| A stolen admin login | **Every admin page** needs two-step sign-in (TOTP), checked on each request, and money actions (crediting balances, approving, paying, freezing) are also checked in the database. Emergency off-switch for the page check only: set `ADMIN_REQUIRE_MFA=off` in Vercel and redeploy. Requests of $1,000 or more need one admin to approve and a **different** admin to mark paid. Every action is logged with who did it (Admin → Withdrawals, "Recent admin activity"). |
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

## Automatic release and the saved payout email (added)

**Automatic release.** After an admin approves a creator's post (one click on the Payouts page), the server releases the creator's earnings to their balance by itself, once:
- the brand has paid (the "brand paid" tick),
- for view-based pay, the measurement window has ended and the view counts are fresh (under 3 days old) and not zero,
- the amount is not more than the brand paid, and the assignment isn't disputed.

A fixed fee only is released at approval. A fixed fee "paid on approval" plus performance pay is released in two stages (the fixed part at approval, the rest at the end of the window). Anything unusual is left alone and shown on the Payouts page as "needs your attention". It runs daily at about 06:30 UTC (`/api/cron/auto-release`, protected by `CRON_SECRET`). The database refuses any credit that doesn't hold these rules, and each stage can be credited only once. **This is bookkeeping only: no money moves until an admin sends the bank transfer.**

**Saved payout email.** A creator saves a payout email once. A withdrawal to an email we've already paid successfully is confirmed on the spot (24h hold). A new or changed email still needs the emailed confirmation and the 72h hold, and the creator is emailed when it changes. A stolen session therefore can't send money to a destination we haven't paid before; at most it can withdraw to the creator's own, already-paid email. The creator can remove the saved email at any time.

Tests: `python3 scripts/test-withdrawals-sql.py` (database rules) and `npx tsx scripts/test-auto-release.ts` (release rules).
