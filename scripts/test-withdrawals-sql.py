"""
Tests the withdrawal SQL (migrations 0016 and 0017) against a real, throwaway
Postgres: balances, the confirm / hold / limit / freeze / two-admin rules,
payment-detail wiping, who may call what, two-step sign-in, and a concurrency
check that six simultaneous full-balance requests produce exactly one winner.

Supabase's own pieces (auth.jwt(), roles, applicants, assignments, is_admin)
are stubbed below; everything under test is the real migration text.

Run it (needs: pip install pgserver psycopg2-binary):

    python3 scripts/test-withdrawals-sql.py
"""
import sys, json, threading, uuid, tempfile, os
sys.path.insert(0, os.environ["PGTEST_PATH"]) if os.environ.get("PGTEST_PATH") else None
import pgserver, psycopg2
from psycopg2 import errors

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = tempfile.mkdtemp()
srv = pgserver.get_server(tmp, cleanup_mode="delete")
uri = srv.get_uri()

def conn():
    c = psycopg2.connect(uri); c.autocommit = True; return c

su = conn(); cur = su.cursor()
cur.execute("""
create schema auth;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to public;
create type applicant_status_enum as enum ('pending','approved','rejected');
create type assignment_status_enum as enum ('active','submitted','paid','disputed');
create table applicants (id uuid primary key default gen_random_uuid(), user_id uuid unique, name text not null, status applicant_status_enum not null default 'approved');
create table assignments (id uuid primary key default gen_random_uuid(), applicant_id uuid references applicants(id), applicant_payout_amount numeric(12,2), status assignment_status_enum default 'paid');
create table admin_emails (email text primary key);
create function is_admin() returns boolean language sql security definer stable as $$ select exists (select 1 from admin_emails where email = (auth.jwt() ->> 'email')) $$;
alter table applicants enable row level security;
create policy a_self on applicants for select using (user_id = auth.uid() or is_admin());
""")
for f in ["0016_creator_balance.sql", "0017_withdrawal_safeguards.sql"]:
    cur.execute(open(f"{REPO}/supabase/migrations/{f}").read())
print("migrations 0016 + 0017 applied OK")

ADMIN1, ADMIN2 = "admin1@x.com", "admin2@x.com"
cur.execute("insert into admin_emails values (%s),(%s)", (ADMIN1, ADMIN2))

def mk_creator(name, status="approved"):
    uid, aid = str(uuid.uuid4()), str(uuid.uuid4())
    cur.execute("insert into applicants (id,user_id,name,status) values (%s,%s,%s,%s)", (aid, uid, name, status))
    return uid, aid

def as_(role, sub=None, email=None, aal="aal2"):
    """Run statements under a role with JWT claims, in their own transaction."""
    class Ctx:
        def __enter__(s):
            s.c = psycopg2.connect(uri); s.c.autocommit = False; s.cu = s.c.cursor()
            s.cu.execute("select set_config('request.jwt.claims', %s, true)", (json.dumps({"sub": sub, "email": email, "role": role, "aal": aal}),))
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

def credit(aid, amt, who=ADMIN1, assignment=None):
    with as_("authenticated", sub=str(uuid.uuid4()), email=who) as c:
        c.execute("insert into balance_entries (applicant_id, amount, kind, assignment_id) values (%s,%s,'earning',%s)", (aid, amt, assignment))

def req(uid, amt, cipher="v1.aaa.bbb.ccc", last4="0695", h="H1", holder="Maria Kostas", tok="T1"):
    with as_("service_role") as c:
        c.execute("select request_withdrawal(%s,%s,%s,%s,%s,%s,%s)", (uid, amt, cipher, last4, h, holder, tok))
        return c.fetchone()[0]

def age(aid):
    cur.execute("update withdrawals set created_at = created_at - interval '2 hours' where applicant_id=%s", (aid,))

def balance(aid):
    cur.execute("select coalesce(sum(amount),0) from balance_entries where applicant_id=%s", (aid,)); return float(cur.fetchone()[0])

def status(wid):
    cur.execute("select status from withdrawals where id=%s", (wid,)); return cur.fetchone()[0]

def confirm(uid, tok):
    with as_("service_role") as c:
        c.execute("select confirm_withdrawal(%s,%s)", (uid, tok)); return c.fetchone()[0]

def decide(wid, action, who=ADMIN1, ref=None, note=None):
    with as_("authenticated", sub=str(uuid.uuid4()), email=who) as c:
        c.execute("select decide_withdrawal(%s,%s,%s,%s)", (wid, action, ref, note))

# ---------------- ledger rules ----------------
u1, a1 = mk_creator("Maria Kostas")
asg = str(uuid.uuid4()); cur.execute("insert into assignments (id,applicant_id,applicant_payout_amount) values (%s,%s,480)", (asg, a1))
credit(a1, 480, assignment=asg)
check("admin can credit an earning", balance(a1) == 480)
check("same assignment can't be credited twice", raises(lambda: credit(a1, 480, assignment=asg), "unique"))
check("creator can't write to the ledger", raises(lambda: (lambda: None)() or (_ for _ in ()).throw(Exception("x")) if False else __import__("builtins").exec("") , "") or
      raises(lambda: [c for c in [as_("authenticated", sub=u1, email="maria@x.com").__enter__()]][0].execute("insert into balance_entries (applicant_id, amount, kind) values (%s, 999, 'earning')", (a1,)), "row-level security"))
def creator_update():
    with as_("authenticated", sub=u1, email="maria@x.com") as c:
        c.execute("update balance_entries set amount = 9999 where applicant_id=%s", (a1,)); 
        if c.rowcount == 0: raise Exception("no rows updated")
check("ledger entries can't be edited", raises(creator_update, "no rows updated") or raises(creator_update, "permission"))

# ---------------- calling rules ----------------
def creator_calls_request():
    with as_("authenticated", sub=u1, email="maria@x.com") as c:
        c.execute("select request_withdrawal(%s,50,'v1.a.b.c','0695','H1','Maria Kostas','T')", (u1,))
check("creator can't call request_withdrawal directly", raises(creator_calls_request, "permission denied"))
def creator_calls_confirm():
    with as_("authenticated", sub=u1, email="maria@x.com") as c: c.execute("select confirm_withdrawal(%s,'x')", (u1,))
check("creator can't call confirm_withdrawal directly", raises(creator_calls_confirm, "permission denied"))
def creator_calls_decide():
    with as_("authenticated", sub=u1, email="maria@x.com") as c: c.execute("select decide_withdrawal(%s,'paid',null,null)", (str(uuid.uuid4()),))
check("a creator can't decide withdrawals", raises(creator_calls_decide, "forbidden"))

# ---------------- request rules ----------------
check("below minimum rejected", raises(lambda: req(u1, 5), "below_minimum"))
check("more than balance rejected", raises(lambda: req(u1, 500), "insufficient_balance"))
check("empty details rejected", raises(lambda: req(u1, 50, cipher="abc"), "bad_details"))
u_pending, a_pending = mk_creator("Pending Person", "pending"); credit(a_pending, 100)
check("unapproved creator can't withdraw", raises(lambda: req(u_pending, 50), "not_approved"))

w1 = req(u1, 100, tok="TOK1")
check("request creates a pending_confirmation row", status(w1) == "pending_confirmation")
check("money is taken the moment of the request", balance(a1) == 380)
check("a second request while one awaits confirmation is refused", raises(lambda: req(u1, 50, tok="TOK2"), "already_pending"))
check("wrong token can't confirm", raises(lambda: confirm(u1, "WRONG"), "invalid_or_expired"))
u_other, a_other = mk_creator("Other Person")
check("another creator can't confirm someone else's request", raises(lambda: confirm(u_other, "TOK1"), "invalid_or_expired"))
confirm(u1, "TOK1")
check("right token confirms", status(w1) == "requested")
cur.execute("select hold_hours, payable_after > now() + interval '71 hours', account_holder_match from withdrawals where id=%s", (w1,))
hh, long_hold, match = cur.fetchone()
check("first withdrawal gets the 72h hold", hh == 72 and long_hold)
check("matching account holder name is recognised", match is True)
check("token can't be used twice", raises(lambda: confirm(u1, "TOK1"), "invalid_or_expired"))
check("admin can't pay during the hold", raises(lambda: decide(w1, "paid"), "on_hold"))

# cancel returns the money
with as_("service_role") as c: c.execute("select cancel_withdrawal(%s,%s)", (u1, w1))
check("cancel returns the money", balance(a1) == 480 and status(w1) == "cancelled")
cur.execute("select payout_details from withdrawals where id=%s", (w1,))
check("cancel wipes the payment details", cur.fetchone()[0].startswith("[removed"))
def cancel_again():
    with as_("service_role") as c: c.execute("select cancel_withdrawal(%s,%s)", (u1, w1))
check("can't cancel twice", raises(cancel_again, "already_decided"))
def other_cancels():
    with as_("service_role") as c: c.execute("select cancel_withdrawal(%s,%s)", (u_other, w1))
check("can't cancel someone else's request", raises(other_cancels, "not_found"))

# ---------------- paying ----------------
w2 = req(u1, 100, tok="TOK3"); confirm(u1, "TOK3")
cur.execute("update withdrawals set payable_after = now() - interval '1 minute' where id=%s", (w2,))
decide(w2, "paid", who=ADMIN1, ref="WISE-123")
cur.execute("select status, payout_details, decided_by, paid_ref from withdrawals where id=%s", (w2,))
st, det, by, ref = cur.fetchone()
check("admin pays after the hold", st == "paid" and by == ADMIN1 and ref == "WISE-123")
check("payment details are wiped once paid", det == "[removed after payment]")
cur.execute("select count(*) from admin_audit where action='withdrawal_paid' and admin_email=%s", (ADMIN1,))
check("the payment is in the audit log with the admin's email", cur.fetchone()[0] == 1)
check("can't pay twice", raises(lambda: decide(w2, "paid"), "already_decided"))
check("balance stays reduced after paying", balance(a1) == 380)

# repeat details => 24h hold
w3 = req(u1, 20, h="H1", tok="TOK4"); confirm(u1, "TOK4")
cur.execute("select hold_hours from withdrawals where id=%s", (w3,)); check("repeat of paid details gets the 24h hold", cur.fetchone()[0] == 24)
w3b_cancel = None
with as_("service_role") as c: c.execute("select cancel_withdrawal(%s,%s)", (u1, w3))
age(a1)
w4 = req(u1, 20, h="DIFFERENT", tok="TOK5")
cur.execute("select hold_hours from withdrawals where id=%s", (w4,)); check("new payment details get the 72h hold again", cur.fetchone()[0] == 72)
with as_("service_role") as c: c.execute("select cancel_withdrawal(%s,%s)", (u1, w4))

# ---------------- name match ----------------
age(a1)
wn = req(u1, 20, holder="Someone Else", tok="TOK6")
cur.execute("select account_holder_match from withdrawals where id=%s", (wn,)); check("a mismatched account name is flagged", cur.fetchone()[0] is False)
with as_("service_role") as c: c.execute("select cancel_withdrawal(%s,%s)", (u1, wn))

# ---------------- reject ----------------
age(a1)
wr = req(u1, 50, tok="TOK7"); confirm(u1, "TOK7"); before = balance(a1)
decide(wr, "rejected", note="Details looked wrong")
check("reject returns the money", balance(a1) == before + 50 and status(wr) == "rejected")

# ---------------- limits ----------------
u2, a2 = mk_creator("Daily Limit"); credit(a2, 5000)
req(u2, 1500, tok="D1"); 
with as_("service_role") as c: pass
cur.execute("update withdrawals set status='requested', confirm_token_hash=null where applicant_id=%s", (a2,))
check("daily limit blocks going over $2,000 in 24h", raises(lambda: req(u2, 600, tok="D2"), "daily_limit"))
req(u2, 400, tok="D3")
u3, a3 = mk_creator("Rate Limit"); credit(a3, 5000)
for i in range(3):
    wid = req(u3, 10, tok=f"R{i}")
    with as_("service_role") as c: c.execute("select cancel_withdrawal(%s,%s)", (u3, wid))
check("a 4th request within an hour is refused", raises(lambda: req(u3, 10, tok="R9"), "too_many"))

# ---------------- freeze ----------------
u4, a4 = mk_creator("Frozen Person"); credit(a4, 300)
with as_("authenticated", sub=str(uuid.uuid4()), email=ADMIN1) as c: c.execute("select freeze_withdrawals(%s,true,'reported')", (a4,))
check("frozen creators can't request", raises(lambda: req(u4, 50, tok="F1"), "frozen"))
def creator_freezes():
    with as_("authenticated", sub=u4, email="x@x.com") as c: c.execute("select freeze_withdrawals(%s,false,null)", (a4,))
check("a creator can't unfreeze themselves", raises(creator_freezes, "forbidden"))
with as_("authenticated", sub=str(uuid.uuid4()), email=ADMIN2) as c: c.execute("select freeze_withdrawals(%s,false,null)", (a4,))
check("an admin can unfreeze", req(u4, 50, tok="F2") is not None)

# ---------------- two-admin rule for large amounts ----------------
u5, a5 = mk_creator("Big Withdrawal"); credit(a5, 1500)
wl = req(u5, 1200, tok="L1"); confirm(u5, "L1")
cur.execute("update withdrawals set payable_after = now() - interval '1 minute' where id=%s", (wl,))
check("a large request can't be paid without approval", raises(lambda: decide(wl, "paid", who=ADMIN1), "needs_second_approval"))
decide(wl, "approve", who=ADMIN1)
check("can't approve twice", raises(lambda: decide(wl, "approve", who=ADMIN2), "already_approved"))
check("the approver can't also pay it", raises(lambda: decide(wl, "paid", who=ADMIN1), "needs_second_approval"))
decide(wl, "paid", who=ADMIN2, ref="WISE-BIG")
check("a different admin can pay it", status(wl) == "paid")

# ---------------- expiry ----------------
u6, a6 = mk_creator("Expiring"); credit(a6, 200)
we = req(u6, 100, tok="E1"); check("money held while unconfirmed", balance(a6) == 100)
cur.execute("update withdrawals set confirm_expires_at = now() - interval '1 minute' where id=%s", (we,))
check("an expired link can't be used", raises(lambda: confirm(u6, "E1"), "invalid_or_expired"))
with as_("service_role") as c: c.execute("select expire_unconfirmed_withdrawals()"); n = c.fetchone()[0]
check("expiry closes it and returns the money", n >= 1 and status(we) == "expired" and balance(a6) == 200)

# ---------------- visibility ----------------
def count_rows(sub, email, table):
    with as_("authenticated", sub=sub, email=email) as c:
        c.execute(f"select count(*) from {table}"); return c.fetchone()[0]
cur.execute("select count(*) from withdrawals where applicant_id=%s", (a1,)); mine = cur.fetchone()[0]
check("a creator sees only their own withdrawals", count_rows(u1, "m@x.com", "withdrawals") == mine and mine == 6 and count_rows(u_other, "o@x.com", "withdrawals") == 0, f"mine={mine} saw={count_rows(u1, chr(109)+chr(64)+chr(120)+chr(46)+chr(99)+chr(111)+chr(109), chr(119)+chr(105)+chr(116)+chr(104)+chr(100)+chr(114)+chr(97)+chr(119)+chr(97)+chr(108)+chr(115))}")
check("a creator sees only their own ledger", count_rows(u_other, "o@x.com", "balance_entries") == 0)
check("a creator can't read the audit log", count_rows(u1, "m@x.com", "admin_audit") == 0)
check("an admin can read the audit log", count_rows(str(uuid.uuid4()), ADMIN1, "admin_audit") > 0)
def creator_updates_withdrawal():
    with as_("authenticated", sub=u1, email="m@x.com") as c:
        c.execute("update withdrawals set status='paid' where applicant_id=%s", (a1,))
        if c.rowcount == 0: raise Exception("no rows updated")
check("a creator can't edit their withdrawals", raises(creator_updates_withdrawal, "no rows updated") or raises(creator_updates_withdrawal, "permission"))

# ---------------- no double spend under concurrency ----------------
u7, a7 = mk_creator("Racer"); credit(a7, 100)
results = []
def racer(i):
    try: req(u7, 100, tok=f"X{i}"); results.append("ok")
    except Exception as e: results.append(str(e).split("\n")[0])
ts = [threading.Thread(target=racer, args=(i,)) for i in range(6)]
[t.start() for t in ts]; [t.join() for t in ts]
check("six simultaneous full-balance requests: exactly one succeeds", results.count("ok") == 1, str(results))
check("balance never goes negative", balance(a7) == 0)


# ---------------- two-step sign-in (aal2) required for money actions ----------------
u8, a8 = mk_creator("Mfa Test"); credit(a8, 300)
w8 = req(u8, 50, tok="M1"); confirm(u8, "M1")
cur.execute("update withdrawals set payable_after = now() - interval '1 minute' where id=%s", (w8,))
def aal1_decide():
    with as_("authenticated", sub=str(uuid.uuid4()), email=ADMIN1, aal="aal1") as c: c.execute("select decide_withdrawal(%s,'paid',null,null)", (w8,))
check("an admin without two-step sign-in can't pay a withdrawal", raises(aal1_decide, "forbidden"))
def aal1_freeze():
    with as_("authenticated", sub=str(uuid.uuid4()), email=ADMIN1, aal="aal1") as c: c.execute("select freeze_withdrawals(%s,true,'x')", (a8,))
check("an admin without two-step sign-in can't freeze", raises(aal1_freeze, "forbidden"))
def aal1_credit():
    with as_("authenticated", sub=str(uuid.uuid4()), email=ADMIN1, aal="aal1") as c: c.execute("insert into balance_entries (applicant_id, amount, kind) values (%s, 50, 'earning')", (a8,))
check("an admin without two-step sign-in can't credit a balance", raises(aal1_credit, "row-level security"))
def aal1_log():
    with as_("authenticated", sub=str(uuid.uuid4()), email=ADMIN1, aal="aal1") as c: c.execute("select log_admin_action('x')")
check("an admin without two-step sign-in can't write the audit log", raises(aal1_log, "forbidden"))
def non_admin_aal2():
    with as_("authenticated", sub=str(uuid.uuid4()), email="notadmin@x.com", aal="aal2") as c: c.execute("select decide_withdrawal(%s,'paid',null,null)", (w8,))
check("a non-admin with two-step sign-in is still refused", raises(non_admin_aal2, "forbidden"))
with as_("authenticated", sub=str(uuid.uuid4()), email=ADMIN1, aal="aal1") as c:
    c.execute("select count(*) from admin_audit"); readable = c.fetchone()[0] >= 0
check("an admin without two-step sign-in can still read (only money actions are gated)", readable)
decide(w8, "paid", who=ADMIN1)
check("with two-step sign-in the same admin can pay", status(w8) == "paid")

cur.execute("select coalesce(sum(amount),0) from balance_entries where amount < 0 and kind <> 'withdrawal'")
check("only withdrawals are ever negative entries", float(cur.fetchone()[0]) == 0)

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
