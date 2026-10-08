"""
Tests migration 0020: the authenticator code is mandatory for admins in the
DATABASE, on every table. Runs the whole migration history (0001 onward) on a
real, throwaway Postgres, then checks who can reach what:

  - an admin whose session has NOT passed two-step sign-in sees and changes nothing
  - the same admin WITH two-step sign-in works as before
  - creators, brands and visitors behave exactly as before
  - every table with row-level security carries the rule, and a new table
    without it is caught

Supabase's own pieces (auth schema, roles, storage tables) are stubbed below;
everything under test is the real migration text.

Run it (needs: pip install pgserver psycopg2-binary):

    python3 scripts/test-admin-mfa-sql.py
"""
import sys, json, uuid, tempfile, os, glob
sys.path.insert(0, os.environ["PGTEST_PATH"]) if os.environ.get("PGTEST_PATH") else None
import pgserver, psycopg2

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv = pgserver.get_server(tempfile.mkdtemp(), cleanup_mode="delete")
uri = srv.get_uri()

su = psycopg2.connect(uri); su.autocommit = True; cur = su.cursor()
cur.execute("""
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
create function auth.email() returns text language sql stable as $$ select auth.jwt()->>'email' $$;
create function auth.role() returns text language sql stable as $$ select auth.jwt()->>'role' $$;
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to public;
create schema storage;
grant usage on schema storage to anon, authenticated, service_role;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
create function storage.foldername(name text) returns text[] language plpgsql as $f$ declare parts text[]; begin select string_to_array(name, '/') into parts; return parts[1:array_length(parts,1)-1]; end $f$;
alter table storage.objects enable row level security;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
""")

# Every migration, in order. (pgcrypto is built into Supabase; this test database lacks it.)
files = sorted(glob.glob(f"{REPO}/supabase/migrations/*.sql"))
for f in files:
    cur.execute(open(f).read().replace("create extension if not exists pgcrypto;", ""))
print(f"applied {len(files)} migrations OK (last: {os.path.basename(files[-1])})")

ADMIN = "admin@x.com"
cur.execute("insert into admin_emails values (%s)", (ADMIN,))

passed = failed = 0
def check(name, ok, extra=""):
    global passed, failed
    if ok: passed += 1
    else: failed += 1
    print(("PASS" if ok else "FAIL"), name, extra if not ok else "")

def as_(role, sub=None, email=None, aal="aal1"):
    class Ctx:
        def __enter__(s):
            s.c = psycopg2.connect(uri); s.c.autocommit = False; s.cu = s.c.cursor()
            s.cu.execute("select set_config('request.jwt.claims', %s, true)", (json.dumps({"sub": sub, "email": email, "role": role, "aal": aal}),))
            s.cu.execute(f"set local role {role}")
            return s.cu
        def __exit__(s, et, ev, tb):
            s.c.rollback() if et else s.c.commit(); s.c.close()
    return Ctx()

def count(table, **who):
    with as_(**who) as c:
        c.execute(f"select count(*) from {table}")
        return c.fetchone()[0]

def blocked(fn):
    try: fn(); return False
    except Exception as e: return "row-level security" in str(e) or "permission denied" in str(e)

# --- seed (superuser bypasses RLS) -------------------------------------------
creator_uid, other_uid = str(uuid.uuid4()), str(uuid.uuid4())
cur.execute("insert into auth.users (id, email) values (%s,'creator@x.com'),(%s,'other@x.com')", (creator_uid, other_uid))
cur.execute("insert into niches (slug,label) values ('n','Niche') returning id"); niche = cur.fetchone()[0]
cur.execute("""insert into jobs (title, description, platform, niche_id, payout_type, payout_amount, status)
               values ('Job','d','tiktok',%s,'flat',50,'open') returning id""", (niche,)); job = cur.fetchone()[0]
cur.execute("insert into applicants (user_id,name,email,handle,platform,status) values (%s,'Maria','creator@x.com','maria','tiktok','approved') returning id", (creator_uid,)); maria = cur.fetchone()[0]
cur.execute("insert into applicants (user_id,name,email,handle,platform,status) values (%s,'Other','other@x.com','other','tiktok','approved')", (other_uid,))
cur.execute("insert into assignments (job_id,applicant_id,applicant_payout_amount,status) values (%s,%s,40,'submitted') returning id", (job, maria)); asg = cur.fetchone()[0]
cur.execute("insert into direct_payments (assignment_id, amount, our_fee, due_at) values (%s,40,10, now() + interval '14 days')", (asg,))
cur.execute("insert into leads (name,email,handles) values ('Lead','lead@x.com','@lead')")
cur.execute("insert into storage.objects (bucket_id, name) values ('work-samples','a/video.mp4')")

admin1 = dict(role="authenticated", sub=str(uuid.uuid4()), email=ADMIN, aal="aal1")   # password only
admin2 = dict(role="authenticated", sub=str(uuid.uuid4()), email=ADMIN, aal="aal2")   # password + authenticator
creator = dict(role="authenticated", sub=creator_uid, email="creator@x.com", aal="aal1")
visitor = dict(role="anon")
server = dict(role="service_role")

# --- the rule is everywhere --------------------------------------------------
cur.execute("""select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
               where n.nspname='public' and c.relkind in ('r','p') and c.relrowsecurity""")
rls_tables = cur.fetchone()[0]
cur.execute("select count(*) from pg_policies where schemaname='public' and policyname='require_mfa_for_admins'")
covered = cur.fetchone()[0]
check(f"every table with row security carries the rule ({covered} of {rls_tables})", rls_tables > 10 and covered == rls_tables)
cur.execute("select count(*) from pg_policies where schemaname='storage' and policyname='require_mfa_for_admins'")
check("sample-video storage carries the rule", cur.fetchone()[0] == 1)

# --- an admin with only a password gets nothing ------------------------------
for table in ["applicants", "assignments", "direct_payments", "jobs", "niches", "leads", "admin_emails"]:
    check(f"admin without the code sees no {table}", count(table, **admin1) == 0)
    check(f"admin with the code sees {table}", count(table, **admin2) >= 1)

def insert_niche(who):
    with as_(**who) as c:
        c.execute("insert into niches (slug,label) values (%s,'x')", (str(uuid.uuid4())[:8],))
check("admin without the code cannot add a niche", blocked(lambda: insert_niche(admin1)))
check("admin with the code can add a niche", not blocked(lambda: insert_niche(admin2)))

with as_(**admin1) as c:
    c.execute("update applicants set status='rejected'")
    check("admin without the code cannot change creators", c.rowcount == 0)
with as_(**admin2) as c:
    c.execute("update applicants set status='approved'")
    check("admin with the code can change creators", c.rowcount == 2)

with as_(**admin1) as c:
    c.execute("select count(*) from storage.objects")
    check("admin without the code cannot see sample videos", c.fetchone()[0] == 0)
with as_(**admin2) as c:
    c.execute("select count(*) from storage.objects")
    check("admin with the code can see sample videos", c.fetchone()[0] == 1)

# --- everyone else is unchanged ----------------------------------------------
check("a creator still sees their own profile, and only theirs", count("applicants", **creator) == 1)
with as_(**creator) as c:
    c.execute("select count(*) from direct_payments")
    check("a creator still cannot see statements or fees", c.fetchone()[0] == 0)
check("a visitor still sees no creators", count("applicants", **visitor) == 0)
def visitor_lead():
    with as_(**visitor) as c:
        c.execute("insert into leads (name,email,handles) values ('New','new@x.com','@new')")
check("a visitor can still send the public lead form", not blocked(visitor_lead))
def visitor_upload():
    with as_(**visitor) as c:
        c.execute("insert into storage.objects (bucket_id, name) values ('work-samples','b/new.mp4')")
check("a visitor can still upload a work sample", not blocked(visitor_upload))
def creator_upload():
    with as_(**creator) as c:
        c.execute("insert into storage.objects (bucket_id, name) values ('work-samples','c/new.mp4')")
check("a signed-in creator can still upload a work sample", not blocked(creator_upload))
check("the server (service role) still sees everything", count("applicants", **server) == 2 and count("direct_payments", **server) == 1)

# --- a forgotten table is caught, and the helper fixes it --------------------
cur.execute("create table forgotten (id int)")
cur.execute("alter table forgotten enable row level security")
def uncovered():
    cur.execute("""select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
                   where n.nspname='public' and c.relkind in ('r','p') and c.relrowsecurity
                     and not exists (select 1 from pg_policies p where p.schemaname='public' and p.tablename=c.relname and p.policyname='require_mfa_for_admins')""")
    return cur.fetchone()[0]
check("a new table without the rule is detected", uncovered() == 1)
cur.execute("select enforce_admin_mfa()")
check("enforce_admin_mfa() covers it, and is safe to run again", uncovered() == 0)
cur.execute("select enforce_admin_mfa()")
check("running it twice changes nothing", uncovered() == 0)
def call_as_creator():
    with as_(**creator) as c:
        c.execute("select enforce_admin_mfa()")
check("ordinary users cannot call enforce_admin_mfa()", blocked(call_as_creator))

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
