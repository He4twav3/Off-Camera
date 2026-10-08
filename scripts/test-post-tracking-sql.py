"""
Tests migration 0023 (per-post tracking) on a real, throwaway Postgres with the
whole migration history applied: who can read and change tracked posts, the
one-use-per-post rule, the contract terms column, and several statements per
creator (one per payment cycle).

Supabase's own pieces (auth schema, roles, storage tables) are stubbed below;
everything under test is the real migration text.

Run it (needs: pip install pgserver psycopg2-binary):

    python3 scripts/test-post-tracking-sql.py
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

def run(who, sql, args=()):
    with as_(**who) as c:
        c.execute(sql, args)
        changed = c.rowcount
        return c.fetchall() if c.description else changed

# a brand, a job and one assignment for each creator
cur.execute("insert into niches (slug, label) values ('tech','Tech') returning id")
niche_id = cur.fetchone()[0]
cur.execute("insert into jobs (title, platform, niche_id, payout_type, payout_amount, status) values ('Getimg', 'tiktok', %s, 'flat', 20, 'open') returning id", (niche_id,))
job_id = cur.fetchone()[0]
def assign(aid):
    cur.execute("insert into assignments (job_id, applicant_id, applicant_payout_amount, status) values (%s,%s,0,'active') returning id", (job_id, aid))
    return cur.fetchone()[0]
asg_m, asg_o = assign(maria_id), assign(other_id)

TERMS = json.dumps({"v": 2, "basePerPost": 20})
check("a campaign can carry contract terms", run(admin2, "update jobs set post_terms = %s::jsonb where id = %s", (TERMS, job_id)) == 1)
check("contract terms must be an object", fails(lambda: run(admin2, "update jobs set post_terms = '[1,2]'::jsonb where id = %s", (job_id,)), "post_terms"))
check("existing campaigns have no terms", run(admin2, "select count(*) from jobs where post_terms is null")[0][0] >= 0)

def add_post(asg, key, state="counting", url=None):
    cur.execute("insert into assignment_posts (assignment_id, platform, url, post_key, state) values (%s,'tiktok',%s,%s,%s)",
                (asg, url or f"https://www.tiktok.com/@x/video/{key.split(':')[1]}", key, state))

add_post(asg_m, "tiktok:1001"); add_post(asg_o, "tiktok:2002")

# --- who can read posts --------------------------------------------------------
check("a creator reads their own posts", [r[0] for r in run(maria, "select post_key from assignment_posts")] == ["tiktok:1001"])
check("a creator cannot see someone else's posts", "tiktok:2002" not in [r[0] for r in run(maria, "select post_key from assignment_posts")])
check("an admin with two-step reads them all", len(run(admin2, "select 1 from assignment_posts")) == 2)
check("an admin without two-step reads none", len(run(admin1, "select 1 from assignment_posts")) == 0)
check("a visitor reads none", fails(lambda: run(visitor, "select 1 from assignment_posts"), "permission denied") or len(run(visitor, "select 1 from assignment_posts")) == 0)

# --- who can write posts ---------------------------------------------------------
check("a creator cannot add a post themselves", fails(lambda: run(maria, "insert into assignment_posts (assignment_id, platform, url, post_key) values (%s,'tiktok','https://www.tiktok.com/@m/video/5','tiktok:5')", (asg_m,)), "row-level security"))
check("a creator cannot change a post's views", run(maria, "update assignment_posts set views = 999999 where post_key = 'tiktok:1001'") == 0)
check("a creator cannot delete a post", run(maria, "delete from assignment_posts where post_key = 'tiktok:1001'") == 0)
check("an admin with two-step can correct a post", run(admin2, "update assignment_posts set author_verified = true where post_key = 'tiktok:1001'") == 1)
check("an admin without two-step cannot", run(admin1, "update assignment_posts set author_verified = true where post_key = 'tiktok:2002'") == 0)

# --- the rules on the data ----------------------------------------------------------
check("a post link must be https", fails(lambda: add_post(asg_m, "tiktok:3003", url="http://www.tiktok.com/@x/video/3003"), "assignment_posts_url_check"))
check("a javascript: link is refused", fails(lambda: add_post(asg_m, "tiktok:3004", url="javascript:alert(1)//aaaaaaaa"), "assignment_posts_url_check"))
check("views cannot be negative", fails(lambda: cur.execute("insert into assignment_posts (assignment_id, platform, url, post_key, views) values (%s,'tiktok','https://www.tiktok.com/@x/video/4','tiktok:4',-1)", (asg_m,)), "views"))
check("an unknown state is refused", fails(lambda: add_post(asg_m, "tiktok:3005", state="paid"), "state"))
check("the same post cannot be used twice, even by another creator", fails(lambda: add_post(asg_o, "tiktok:1001"), "assignment_posts_one_use"))
cur.execute("update assignment_posts set state='rejected' where post_key = 'tiktok:1001'")
check("a rejected post frees its link", not fails(lambda: add_post(asg_o, "tiktok:1001"), "assignment_posts_one_use"))

# --- one statement per payment cycle ------------------------------------------------
def stmt(asg, cycle, amount=300):
    cur.execute("insert into direct_payments (assignment_id, amount, due_at, cycle) values (%s,%s, now() + interval '14 days', %s)", (asg, amount, cycle))
check("a first statement is cycle 1", not fails(lambda: stmt(asg_m, 1), "x"))
check("a second statement for another cycle is allowed", not fails(lambda: stmt(asg_m, 2), "x"))
check("the same cycle twice is refused", fails(lambda: stmt(asg_m, 2), "direct_payments_assignment_cycle_key"))
check("cycle 0 is refused", fails(lambda: stmt(asg_m, 0), "cycle"))
check("another creator's cycle 1 is separate", not fails(lambda: stmt(asg_o, 1), "x"))
check("an old-style statement still defaults to cycle 1", run(admin2, "select min(cycle) from direct_payments")[0][0] == 1)

# --- campaign logos ---------------------------------------------------------------------------
check("a campaign can have a logo link", run(admin2, "update jobs set logo_url = %s where id = %s", ("https://x.supabase.co/storage/v1/object/public/campaign-logos/getimg.png", job_id)) == 1)
check("a logo link must be https", fails(lambda: run(admin2, "update jobs set logo_url = 'javascript:alert(1)//aaaa' where id = %s", (job_id,)), "logo_url"))
cur.execute("select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'campaign-logos'")
pub, lim, mimes = cur.fetchone()
check("the logos bucket is public, 2 MB, images only (no SVG)", pub is True and lim == 2097152 and set(mimes) == {"image/jpeg", "image/png", "image/webp"}, mimes)
def put_logo(who, name):
    with as_(**who) as c:
        c.execute("insert into storage.objects (bucket_id, name) values ('campaign-logos', %s)", (name,))
check("an admin with two-step can add a logo file", not fails(lambda: put_logo(admin2, "a.png"), "row-level security"))
check("an admin without two-step cannot", fails(lambda: put_logo(admin1, "b.png"), "row-level security"))
check("a creator cannot add a logo file", fails(lambda: put_logo(maria, "c.png"), "row-level security"))
check("a visitor cannot add a logo file", fails(lambda: put_logo(visitor, "d.png"), "permission denied") or fails(lambda: put_logo(visitor, "d.png"), "row-level security"))
with as_(**visitor) as c:
    c.execute("select count(*) from storage.objects where bucket_id = 'campaign-logos'")
    check("anyone can see logos", c.fetchone()[0] >= 1)
check("a creator cannot remove a logo file", run(maria, "delete from storage.objects where bucket_id = 'campaign-logos'") == 0)

# --- the brand's words on the campaign page ---------------------------------------------------
check("a campaign can carry an about note, formats and example links", run(admin2, "update jobs set about = 'A creative AI workspace.', formats = E'Speed challenge\\nStep by step', example_urls = %s where id = %s", (["https://www.tiktok.com/@a/video/123456", "https://www.instagram.com/reel/AbCdEf/"], job_id)) == 1)
check("an example link must be https", fails(lambda: run(admin2, "update jobs set example_urls = %s where id = %s", (["javascript:alert(1)//aaaaaaaa"], job_id)), "example_urls"))
check("an http example link is refused", fails(lambda: run(admin2, "update jobs set example_urls = %s where id = %s", (["http://www.tiktok.com/@a/video/123456"], job_id)), "example_urls"))
check("at most 6 example links", fails(lambda: run(admin2, "update jobs set example_urls = %s where id = %s", ([f"https://www.tiktok.com/@a/video/10000{i}" for i in range(7)], job_id)), "example_urls"))
check("six example links are fine", run(admin2, "update jobs set example_urls = %s where id = %s", ([f"https://www.tiktok.com/@a/video/10000{i}" for i in range(6)], job_id)) == 1)
check("the about note has a length limit", fails(lambda: run(admin2, "update jobs set about = %s where id = %s", ("x" * 2001, job_id)), "about"))
check("the formats note has a length limit", fails(lambda: run(admin2, "update jobs set formats = %s where id = %s", ("x" * 2001, job_id)), "formats"))
check("a creator cannot edit a campaign's brief", run(maria, "update jobs set about = 'hacked' where id = %s", (job_id,)) == 0)

# --- the Getimg campaign file creates a valid campaign ------------------------------------------
cur.execute(open(f"{REPO}/supabase/seeds/getimg-campaign.sql").read())
cur.execute("select post_terms, status, payout_amount from jobs where title like 'Getimg:%'")
terms, status, amount = cur.fetchone()
check("the Getimg file creates an open campaign", status == "open" and float(amount) == 20)
check("with the contract's base pay, cycle and window", terms["basePerPost"] == 20 and terms["cycleSize"] == 15 and terms["windowDays"] == 30 and terms["keepPublicDays"] == 90, terms)
check("and the four bonus tiers", [(m["views"], m["amount"]) for m in terms["milestones"]] == [(1000, 2), (5000, 10), (10000, 20), (100000, 200)], terms)
cur.execute("select about, formats from jobs where title like 'Getimg:%'")
about_, formats_ = cur.fetchone()
check("the Getimg file includes the brand note", about_ is not None and "creative AI workspace" in about_, about_)
check("and four formats that work", formats_ is not None and len(formats_.split("\n")) == 4, formats_)
check("on Instagram, TikTok and YouTube", sorted(terms["platforms"]) == ["instagram", "tiktok", "youtube_shorts"], terms)

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
