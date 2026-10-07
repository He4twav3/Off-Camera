# Admin security: what protects the admin area

Four separate locks, so that losing any one of them is not enough.

1. **The admin list.** Only emails in `admin_emails` are admins. Everyone else
   gets a plain "not found" for `/admin`.
2. **The password.** The normal login.
3. **The authenticator code.** Every admin page needs it (the website checks
   it), **and so does the database** (migration `0020`). The database part is the
   one that matters: Supabase's login service is public, so a password alone
   could otherwise be used to read admin data through the API without ever
   visiting the site.
4. **Database rules (RLS).** Every table says who may read and write it. The
   service-role key bypasses them, so it lives only in Vercel.

## How the database enforces the authenticator

`0020_require_mfa_for_admins.sql` adds a *restrictive* policy,
`require_mfa_for_admins`, to every table in `public` and to `storage.objects`.
A restrictive policy is ANDed with all the others: an account on the admin list
can do nothing unless its session passed two-step sign-in (`aal2`). Creators,
brands and visitors are not affected.

`scripts/test-admin-mfa-sql.py` runs every migration on a real Postgres and
checks all of this, including that an admin with only a password sees and
changes nothing, and that a table without the rule is caught. It runs in the
automatic checks.

### When you add a table

Run `select enforce_admin_mfa();` right after creating it (and enabling row
level security). The test above fails if you forget.

## If an admin is locked out
Lost the authenticator? In Supabase: Authentication, Users, the user, remove
their factor. They sign in and enrol a new one at `/admin/security`.
`ADMIN_REQUIRE_MFA=off` only relaxes the website's page check. The database
rule stays on, so it cannot be used to read data without the code.

## Other habits
- Long, unique passwords from a password manager for every admin.
- Two-step sign-in on the admin's email, Supabase, Vercel and GitHub accounts.
- Delete `TEAM_SIGNUP_KEY` from Vercel once both admins have signed up.
