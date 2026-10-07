# Admin on its own address, behind Cloudflare Access

Goal: nobody can even reach the admin login without first passing a one-time
email check, and the public site has no admin at all.

```
you -> Cloudflare Access (email code) -> Cloudflare adds a secret header -> Vercel
                                                                         |
          the site answers the admin address only when the secret header is right
```

## What the app does (code: lib/admin-host.ts, src/proxy.ts)
Set `ADMIN_HOST` in **Production**:
- On every other address, `/admin` is a 404.
- On the admin address only admin, login, password-reset and sign-out exist.
  Everything else (landing page, creator and brand areas, sign-up, the API) is a
  404, and `/` goes to `/admin`.
- The admin address answers only when the request carries `x-oncamera-edge`
  equal to `ADMIN_EDGE_SECRET`. That is what stops someone skipping Cloudflare by
  sending the admin address straight to Vercel. If `ADMIN_EDGE_SECRET` is
  missing, the admin address serves nothing (fails closed).
- Unset on staging and previews: admin stays at `/admin` there.

To switch it all off: delete `ADMIN_HOST` in Vercel and redeploy.

## Setup (recommended: a separate cheap domain)
Use a separate domain just for admin, such as `oncamera-ops.com`. The main
domain's DNS (and its email) stays untouched, and the admin cookies are fully
separate from the public site. Using a subdomain of the main domain also works,
but then the whole domain's nameservers must move to Cloudflare, and a missed
email record would break email.

1. **Cloudflare** (free): Add a domain, choose Free, and set the two nameservers
   it gives you at the registrar. Wait for "Active".
2. **Vercel**: Project, Settings, Domains, add `admin.<domain>`.
3. **Cloudflare DNS**: add a CNAME `admin` pointing to what Vercel shows
   (normally `cname.vercel-dns.com`), proxy **DNS only (grey)**. Wait until
   Vercel says the domain is valid and has a certificate. Vercel must verify
   before the proxy is on.
4. **Cloudflare SSL/TLS**: set the mode to **Full** (Vercel's recommendation).
5. Turn the record to **Proxied (orange)**. Access only works on proxied traffic.
6. **Zero Trust** (free under 50 users; may ask for a payment method, $0):
   Settings, Authentication: make sure **One-time PIN** is enabled. Access,
   Applications, Add, **Self-hosted**: domain `admin.<domain>` (no path). Policy
   "Admins": Allow, Include, **Emails**: the two admin emails. Session 8 hours.
7. **Secret header**: generate a value with `openssl rand -base64 32`.
   Cloudflare (the domain), Rules, Transform Rules, **Modify Request Header**:
   when Hostname equals `admin.<domain>`, set static header `x-oncamera-edge` to
   that value. Deploy.
8. **Vercel env, Production only**, after the code is deployed and steps 1 to 7
   work: `ADMIN_HOST=admin.<domain>` and `ADMIN_EDGE_SECRET=<the same value>`.
   Redeploy.
9. **Supabase**: Authentication, URL Configuration: add `https://admin.<domain>/**`
   to the Redirect URLs.

## Check
- A private window on `https://admin.<domain>`: Cloudflare asks for your email,
  sends a code, then the OnCamera login, then the authenticator code.
- `https://www.<main domain>/admin` says "Not found".
- `https://<project>.vercel-url/admin` says "Not found".
- Anyone not on the policy never gets a code and never sees the login.

## Notes
- Admin sessions live on the admin address only. Log in there.
- Password-reset emails land on the main address. Set the password there, then
  log in on the admin address.
- If an admin address is ever unreachable, delete `ADMIN_HOST` and redeploy.
