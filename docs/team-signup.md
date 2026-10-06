# Team (admin) sign-up

Team members create their accounts at `/team`, separate from the creator and brand sign-up.

## Protections
- **Closed by default.** The page works only while `TEAM_SIGNUP_KEY` (16+ characters) is set in Vercel. Remove it when the team has signed up and the page closes again.
- **Team access key** required (compared in constant time), with tight rate limits per visitor and per email.
- **Admin list only.** An account is created only for an email already in `admin_emails`. Once the key is right, the page answers the same way whether or not the email is on the list, so the list can't be probed.
- **Email code** to the inbox, bound to the browser that started sign-up, with attempt limits (the same mechanism as creator sign-up).
- **Strong password:** 12+ characters, at least three character types, no common words, not containing the email name.
- **Not a back door:** the code can only confirm an account that was created as a team account for a listed email.
- After sign-up the person lands on `/admin/security` to set up their authenticator. Every admin page needs it, and money actions are also checked in the database.

## Opening and closing it
1. Generate a key: `openssl rand -base64 24`.
2. Vercel → Settings → Environment Variables → add `TEAM_SIGNUP_KEY`, then Redeploy.
3. Each team member opens `/team`, enters the key, their email, a password, then the emailed code.
4. When everyone is in: delete `TEAM_SIGNUP_KEY` from Vercel and Redeploy. `/team` now says "closed".

The remaining risk is the inbox: anyone who controls an admin's email inbox before that admin signs up could create the account if they also had the key. Keep the key private and short-lived.
