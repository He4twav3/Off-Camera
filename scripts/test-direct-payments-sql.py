"""
Tests migration 0019 (direct payments) against a real, throwaway Postgres:
who can read and write statements (admins only; our fee must never reach a
creator or a brand), the one-statement-per-assignment rule, the amount and
length checks, and the "confirmed or disputed, never both" rule.

Supabase's own pieces (auth.jwt(), roles, applicants, assignments, is_admin)
are stubbed below; the migration under test is the real file.

Run it (needs: pip install pgserver psycopg2-binary):

    python3 scripts/test-direct-payments-sql.py
"""
import sys, json, uuid, tempfile, os
sys.path.insert(0, os.environ["PGTEST_PATH"]) if os.environ.get("PGTEST_PATH") else None
import pgserver, psycopg2

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = tempfile.mkdtemp()
srv = pgserver.get_server(tmp, cleanup_mode="delete")
uri = srv.get_uri()

su = psycopg2.connect(uri); su.autocommit = True; cur = su.cursor()
cur.execute("""
create schema auth;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to public;
create table applicants (id uuid primary key default gen_random_uuid(), user_id uuid unique, name text not null);
create table assignments (id uuid primary key default gen_random_uuid(), applicant_id uuid references applicants(id), status text default 'submitted');
create table admin_emails (email text primary key);
create function is_admin() returns boolean language sql security definer stable as $$ select exists (select 1 from admin_emails where email = (auth.jwt() ->> 'email')) $$;
""")
cur.execute(open(f"{REPO}/supabase/migrations/0019_direct_payments.sql").read())
print("migration 0019 applied OK")

ADMIN = "admin@x.com"
cur.execute("insert into admin_emails values (%s)", (ADMIN,))

def as_(role, sub=None, email=None):
    class Ctx:
        def __enter__(s):
            s.c = psycopg2.connect(uri); s.c.autocommit = False; s.cu = s.c.cursor()
            s.cu.execute("select set_config('request.jwt.claims', %s, true)", (json.dumps({"sub": sub, "email": email, "role": role}),))
            s.cu.execute(f"set local role {role}")
            return s.cu
        def __exit__(s, et, ev, tb):
            s.c.rollback() if et else s.c.commit(); s.c.close()
    return Ctx()

passed = failed = 0
def check(name, ok, extra=""):
    global passed, failed
    if ok: passed += 1
    else: failed += 1
    print(("PASS" if ok else "FAIL"), name, extra if not ok else "")

def raises(fn, needle):
    try: fn(); return False
    except Exception as e: return needle in str(e)

def mk_assignment():
    uid, aid, asg = str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())
    cur.execute("insert into applicants (id,user_id,name) values (%s,%s,'Maria')", (aid, uid))
    cur.execute("insert into assignments (id,applicant_id) values (%s,%s)", (asg, aid))
    return uid, aid, asg

def admin_insert(asg, amount=100, fee=20, extra=""):
    with as_("authenticated", sub=str(uuid.uuid4()), email=ADMIN) as c:
        c.execute(
            "insert into direct_payments (assignment_id, amount, our_fee, due_at) values (%s,%s,%s, now() + interval '14 days') returning id",
            (asg, amount, fee),
        )
        return c.fetchone()[0]

# --- who can see and write ---------------------------------------------------
creator, applicant, asg = mk_assignment()
dp = admin_insert(asg)
check("admin can issue a statement", dp is not None)

with as_("authenticated", sub=creator, email="maria@x.com") as c:
    c.execute("select count(*) from direct_payments")
    check("a creator cannot read statements (our fee stays private)", c.fetchone()[0] == 0)

def _try_creator_insert():
    with as_("authenticated", sub=creator, email="maria@x.com") as c:
        c.execute("insert into direct_payments (assignment_id, amount, due_at) values (%s, 50, now())", (str(uuid.uuid4()),))
check("a creator cannot insert a statement", raises(_try_creator_insert, "row-level security"))

with as_("authenticated", sub=creator, email="maria@x.com") as c:
    c.execute("update direct_payments set creator_confirmed_at = now() where id = %s", (dp,))
    check("a creator cannot update a statement directly", c.rowcount == 0)

with as_("anon") as c:
    c.execute("select count(*) from direct_payments")
    check("an anonymous visitor sees nothing", c.fetchone()[0] == 0)

with as_("service_role") as c:
    c.execute("update direct_payments set brand_paid_at = now(), brand_method = 'PayPal' where id = %s", (dp,))
    check("server code (service role) can record the brand's payment", c.rowcount == 1)

# --- the rules in the table --------------------------------------------------
def dup():
    admin_insert(asg)
check("one statement per assignment", raises(dup, "direct_payments_assignment_id_key"))

_, _, asg2 = mk_assignment()
check("amount must be positive", raises(lambda: admin_insert(asg2, amount=0), "direct_payments_amount_check"))
check("our fee can't be negative", raises(lambda: admin_insert(asg2, fee=-1), "direct_payments_our_fee_check"))

def both():
    with as_("service_role") as c:
        c.execute("update direct_payments set creator_confirmed_at = now(), creator_disputed_at = now() where id = %s", (dp,))
check("a statement can't be confirmed and disputed at once", raises(both, "direct_payments_not_both"))

with as_("service_role") as c:
    c.execute("update direct_payments set creator_confirmed_at = now(), creator_disputed_at = null where id = %s", (dp,))
    check("confirming clears a dispute", c.rowcount == 1)

# --- payout instructions length ----------------------------------------------
def set_instr(value):
    with as_("service_role") as c:
        c.execute("update applicants set payout_instructions = %s where id = %s", (value, applicant))
check("payout instructions: too short is refused", raises(lambda: set_instr("abc"), "payout_instructions_check"))
check("payout instructions: too long is refused", raises(lambda: set_instr("x" * 201), "payout_instructions_check"))
check("payout instructions: a normal value is accepted", not raises(lambda: set_instr("PayPal: maria@example.com"), "payout_instructions_check"))
check("payout instructions: can be cleared", not raises(lambda: set_instr(None), "payout_instructions_check"))

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
