"""
Tests migration 0022 (profile picture and Discord name) on a real, throwaway
Postgres with the whole migration history applied: the field checks, and who can
write to the avatars bucket (only your own folder).

Supabase's own pieces (auth schema, roles, storage tables) are stubbed below;
everything under test is the real migration text.

Run it (needs: pip install pgserver psycopg2-binary):

    python3 scripts/test-profile-picture-sql.py
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

def set_(who, sql, args):
    with as_(**who) as c:
        c.execute(sql, args)
        return c.rowcount

# --- the two new fields ------------------------------------------------------
check("a creator can set their own picture link", set_(maria, "update applicants set avatar_url = %s where id = %s", ("https://x.supabase.co/storage/v1/object/public/avatars/a/b.png", maria_id)) == 1)
check("a picture link must be https", fails(lambda: set_(maria, "update applicants set avatar_url = %s where id = %s", ("javascript:alert(1)", maria_id)), "avatar_url"))
check("a picture link cannot be a data: link", fails(lambda: set_(maria, "update applicants set avatar_url = %s where id = %s", ("data:image/png;base64,AAAA", maria_id)), "avatar_url"))
check("a creator cannot change someone else's picture", set_(maria, "update applicants set avatar_url = %s where id = %s", ("https://x.co/a.png", other_id)) == 0)
check("a Discord name is accepted", set_(maria, "update applicants set discord_username = %s where id = %s", ("maria_ugc", maria_id)) == 1)
check("a Discord name with spaces is refused", fails(lambda: set_(maria, "update applicants set discord_username = %s where id = %s", ("maria ugc", maria_id)), "discord_username"))
check("a one-letter Discord name is refused", fails(lambda: set_(maria, "update applicants set discord_username = %s where id = %s", ("m", maria_id)), "discord_username"))
check("a Discord name in capitals is refused (stored lowercase)", fails(lambda: set_(maria, "update applicants set discord_username = %s where id = %s", ("Maria", maria_id)), "discord_username"))
check("a creator can clear their Discord name", set_(maria, "update applicants set discord_username = null where id = %s", (maria_id,)) == 1)

# --- the avatars bucket --------------------------------------------------------
cur.execute("select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'avatars'")
public, limit, mimes = cur.fetchone()
check("the avatars bucket is public", public is True)
check("the avatars bucket is limited to 2 MB", limit == 2097152)
check("only image types are allowed", set(mimes) == {"image/jpeg", "image/png", "image/webp", "image/gif"})

maria_uid, other_uid = maria["sub"], other["sub"]
def put(who, path):
    with as_(**who) as c:
        c.execute("insert into storage.objects (bucket_id, name) values ('avatars', %s)", (path,))
check("a creator can add a file to their own folder", not fails(lambda: put(maria, f"{maria_uid}/me.png"), "row-level security"))
check("a creator cannot add a file to someone else's folder", fails(lambda: put(maria, f"{other_uid}/me.png"), "row-level security"))
check("a creator cannot add a file at the top level", fails(lambda: put(maria, "me.png"), "row-level security"))
check("a visitor cannot add a file", fails(lambda: put(visitor, f"{maria_uid}/v.png"), "permission denied") or fails(lambda: put(visitor, f"{maria_uid}/v.png"), "row-level security"))

cur.execute("insert into storage.objects (bucket_id, name) values ('avatars', %s)", (f"{other_uid}/theirs.png",))
def replace(who, path):
    with as_(**who) as c:
        c.execute("update storage.objects set name = name where bucket_id = 'avatars' and name = %s", (path,)); return c.rowcount
def remove(who, path):
    with as_(**who) as c:
        c.execute("delete from storage.objects where bucket_id = 'avatars' and name = %s", (path,)); return c.rowcount
check("a creator can replace their own file", replace(maria, f"{maria_uid}/me.png") == 1)
check("a creator cannot replace someone else's file", replace(maria, f"{other_uid}/theirs.png") == 0)
check("a creator cannot remove someone else's file", remove(maria, f"{other_uid}/theirs.png") == 0)
check("a creator can remove their own file", remove(maria, f"{maria_uid}/me.png") == 1)

with as_(**visitor) as c:
    c.execute("select count(*) from storage.objects where bucket_id = 'avatars'")
    check("pictures can be read by anyone", c.fetchone()[0] >= 1)

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
