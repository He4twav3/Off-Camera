"""
Tests migration 0021 (creator videos) on a real, throwaway Postgres with the
whole migration history applied: who can see and change a creator's videos, the
3-video limit, https-only links, and the checks on the videos copied onto an
application.

Supabase's own pieces (auth schema, roles, storage tables) are stubbed below;
everything under test is the real migration text.

Run it (needs: pip install pgserver psycopg2-binary):

    python3 scripts/test-creator-videos-sql.py
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

def fails(fn, needle):
    try: fn(); return False
    except Exception as e: return needle in str(e)

def mk_creator(name):
    uid, aid = str(uuid.uuid4()), str(uuid.uuid4())
    cur.execute("insert into auth.users (id, email) values (%s,%s)", (uid, f"{name}@x.com"))
    cur.execute("insert into applicants (id,user_id,name,email,handle,platform,status) values (%s,%s,%s,%s,%s,'tiktok','approved')", (aid, uid, name, f"{name}@x.com", name))
    return dict(role="authenticated", sub=uid, email=f"{name}@x.com"), aid

maria, maria_id = mk_creator("maria")
other, other_id = mk_creator("other")
admin1 = dict(role="authenticated", sub=str(uuid.uuid4()), email=ADMIN, aal="aal1")
admin2 = dict(role="authenticated", sub=str(uuid.uuid4()), email=ADMIN, aal="aal2")
visitor = dict(role="anon")

def add(who, applicant_id, url, title=None, platform="tiktok"):
    with as_(**who) as c:
        c.execute("insert into applicant_videos (applicant_id, platform, url, title) values (%s,%s,%s,%s) returning id", (applicant_id, platform, url, title))
        return c.fetchone()[0]

v1 = add(maria, maria_id, "https://www.tiktok.com/@maria/video/1", "My best one")
check("a creator can add a video to their own profile", v1 is not None)

with as_(**maria) as c:
    c.execute("select count(*) from applicant_videos"); check("a creator sees their own videos", c.fetchone()[0] == 1)
with as_(**other) as c:
    c.execute("select count(*) from applicant_videos"); check("another creator cannot see them", c.fetchone()[0] == 0)
with as_(**visitor) as c:
    c.execute("select count(*) from applicant_videos"); check("a visitor cannot see them", c.fetchone()[0] == 0)
with as_(**admin1) as c:
    c.execute("select count(*) from applicant_videos"); check("an admin without the authenticator code cannot see them", c.fetchone()[0] == 0)
with as_(**admin2) as c:
    c.execute("select count(*) from applicant_videos"); check("an admin with the code can see them", c.fetchone()[0] == 1)

check("a creator cannot add a video to someone else's profile",
      fails(lambda: add(maria, other_id, "https://www.tiktok.com/@x/video/9"), "row-level security"))
check("a visitor cannot add a video", fails(lambda: add(visitor, maria_id, "https://www.tiktok.com/@x/video/9"), "permission denied") or fails(lambda: add(visitor, maria_id, "https://www.tiktok.com/@x/video/9"), "row-level security"))

check("the same video cannot be listed twice", fails(lambda: add(maria, maria_id, "https://www.tiktok.com/@maria/video/1"), "applicant_videos_applicant_id_url_key"))
check("a link that is not https is refused", fails(lambda: add(maria, maria_id, "http://www.tiktok.com/@maria/video/2"), "applicant_videos_url_check"))
check("a javascript: link is refused", fails(lambda: add(maria, maria_id, "javascript:alert(1)//abcdef"), "applicant_videos_url_check"))
check("a title over 80 characters is refused", fails(lambda: add(maria, maria_id, "https://www.tiktok.com/@maria/video/3", "x" * 81), "applicant_videos_title_check"))

with as_(**other) as c:
    c.execute("delete from applicant_videos where id = %s", (v1,))
    check("a creator cannot delete someone else's video", c.rowcount == 0)
with as_(**maria) as c:
    c.execute("delete from applicant_videos where id = %s", (v1,))
    check("a creator can remove their own video", c.rowcount == 1)

# --- the limit ---------------------------------------------------------------
for i in range(3):
    add(maria, maria_id, f"https://www.tiktok.com/@maria/video/{100 + i}")
check("a creator can have 3 videos", True)
check("the 4th video is refused", fails(lambda: add(maria, maria_id, "https://www.tiktok.com/@maria/video/999"), "too_many_videos"))
check("another creator's limit is separate", not fails(lambda: add(other, other_id, "https://www.tiktok.com/@other/video/1"), "too_many_videos"))

# --- the copy on an application ------------------------------------------------
cur.execute("insert into niches (slug,label) values ('n','N') returning id"); niche = cur.fetchone()[0]
cur.execute("""insert into jobs (title, description, platform, niche_id, payout_type, payout_amount, status)
               values ('Job','d','tiktok',%s,'flat',50,'open') returning id""", (niche,)); job = cur.fetchone()[0]

def apply(urls, applicant_id=maria_id, who=maria, job_id=None):
    with as_(**who) as c:
        c.execute("insert into applications (job_id, applicant_id, video_urls) values (%s,%s,%s)", (job_id or job, applicant_id, urls))

check("an application can carry up to 5 https videos", not fails(lambda: apply(["https://www.tiktok.com/@maria/video/%d" % i for i in range(5)]), "applications_video_urls_check"))
cur.execute("insert into jobs (title, description, platform, niche_id, payout_type, payout_amount, status) values ('Job2','d','tiktok',%s,'flat',50,'open') returning id", (niche,)); job2 = cur.fetchone()[0]
check("6 videos on one application is refused", fails(lambda: apply(["https://a.example/%d" % i for i in range(6)], job_id=job2), "applications_video_urls_check"))
check("a javascript: link on an application is refused", fails(lambda: apply(["javascript:alert(1)"], job_id=job2), "applications_video_urls_check"))
check("a data: link on an application is refused", fails(lambda: apply(["data:text/html,<script>1</script>"], job_id=job2), "applications_video_urls_check"))
check("an application with no videos still works (older ones have none)", not fails(lambda: apply([], job_id=job2), "applications_video_urls_check"))

# --- the authenticator rule covers the new table --------------------------------
cur.execute("select count(*) from pg_policies where schemaname='public' and tablename='applicant_videos' and policyname='require_mfa_for_admins'")
check("the authenticator rule from 0020 covers the new table", cur.fetchone()[0] == 1)

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
