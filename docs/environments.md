# Live site and staging copy

There are two complete copies of the site. **Nothing reaches the live site until it has been tried on staging.**

| | Live (production) | Staging (test copy) |
|---|---|---|
| Website | oncameraugc.com, built from the `main` branch | A Vercel "Preview" address (optionally `staging.oncameraugc.com`) |
| Database | The live Supabase project | A **separate** Supabase project, with fake data only |
| Emails | Real | Only to the test addresses you allow |
| Banner | none | Yellow "STAGING" bar on every page |
| Daily jobs (views, auto-release) | Run | Don't run (Vercel runs scheduled jobs on production only) |

## The rule
1. Work happens on a **branch**, never directly on `main`.
2. Open a pull request. The **Checks** run automatically (types, lint, rule tests, database tests, build). They must be green.
3. Run any new SQL on the **staging** database first, then try the change on the branch's Preview address.
4. Only then merge to `main`, and run the SQL on the live database.

## What protects you from mistakes
- **Wrong database:** each environment sets `EXPECTED_SUPABASE_REF` (its own project id). If the site is ever started with the other project's address, it refuses to use the database.
- **Emailing real people from staging:** staging sends only to `STAGING_EMAIL_ALLOWLIST`; everything else is skipped.
- **Looking at the wrong site:** the yellow banner.
- **Broken changes:** the automatic checks, and the branch rule below.

## One-time setup (about 30 minutes)

### 1. Supabase: create the staging project
1. New project, named like `oncamera-staging`, same region as the live one. Note its **project id** (the first part of its URL).
2. SQL Editor: run **every file in `supabase/migrations/` in number order**, one at a time, starting at `0001` (skip none). The files already on the live site are in the same list.
3. Authentication settings, **the same as live**:
   - "Allow new users to sign up": **off**
   - "Confirm email": **on**
   - Multi-factor (TOTP): **on**
   - Site URL and Redirect URLs: the staging address
4. Add your test admin emails: `insert into admin_emails (email) values ('you+staging@gmail.com');`
5. Use plus-addresses for test accounts (`you+creator1@gmail.com`). Never copy real users or real data into staging.

### 2. Vercel: give staging its own settings
Settings, Environment Variables. Add each variable below **twice**, once scoped to **Production** and once to **Preview**, with different values:

| Variable | Production | Preview (staging) |
|---|---|---|
| `APP_ENV` | `production` | `staging` |
| `EXPECTED_SUPABASE_REF` | live project id | staging project id |
| `NEXT_PUBLIC_SUPABASE_URL` | live URL | staging URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | live anon key | staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | live service key | staging service key |
| `WITHDRAWAL_DETAILS_KEY` | live key | a **different** key (`openssl rand -base64 32`) |
| `TEAM_SIGNUP_KEY` | only while the team signs up | only while testing it |
| `CRON_SECRET` | live secret | any value |
| `STAGING_EMAIL_ALLOWLIST` | not set | your test emails, or `@yourdomain.com` |
| Email, site address and any other keys in `.env.local.example` | live values | staging values |

Never put a live key in a Preview variable. If you do, the wrong-database guard stops the site and tells you why.

Optional: Vercel → Domains → add `staging.oncameraugc.com` and assign it to the Git branch `staging`.

### 3. GitHub: stop direct pushes to main
Settings, Branches, add a rule for `main`:
- **Require a pull request before merging**
- **Require status checks to pass**, and choose **Checks / checks**
- Optionally: require one approval, and include administrators.

## Before merging anything that touches money, sign-in or the database
- [ ] SQL ran on staging without errors, then on live after merging
- [ ] The Preview address works: sign up, sign in, the changed page
- [ ] A creator test account and an admin test account both tried the change
- [ ] Checks are green
- [ ] No live key was used in staging

## Keeping the two copies in step
Staging should always have **the same SQL files** as live, in the same order. When a new file is added to `supabase/migrations/`, run it on staging first, then on live.
