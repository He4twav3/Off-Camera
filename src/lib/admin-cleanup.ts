import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Clearing out test and placeholder accounts. What is kept is decided here, on the server, every time:
 * the admins, the signed-in admin, the Getimg brand account, Getimg's campaign(s), and any creator who has
 * joined one of those campaigns. Everything else can be picked for deletion.
 */
const GETIMG = /getimg/i;

export type CleanupAccount = {
  userId: string;
  email: string;
  kind: "Creator" | "Brand" | "No profile";
  name: string;
  detail: string;
  keptBecause: string | null;
  /** Kept unless you tick it yourself (a creator on Getimg's campaign). Admins, you and Getimg are never selectable. */
  soft: boolean;
};
export type CleanupJob = { id: string; title: string; creators: number; keptBecause: string | null };

export async function loadCleanup(currentUserId: string) {
  const db = createAdminClient();
  const users: { id: string; email: string; created_at: string }[] = [];
  for (let page = 1; page < 20; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 200 });
    const batch = data?.users ?? [];
    users.push(...batch.map((u) => ({ id: u.id, email: (u.email ?? "").toLowerCase(), created_at: u.created_at })));
    if (batch.length < 200) break;
  }
  const [{ data: admins }, { data: applicants }, { data: brands }, { data: jobs }, { data: assignments }] = await Promise.all([
    db.from("admin_emails").select("email"),
    db.from("applicants").select("id, user_id, name"),
    db.from("brand_accounts").select("id, user_id, company_name"),
    db.from("jobs").select("id, title, brand_account_id"),
    db.from("assignments").select("id, job_id, applicant_id"),
  ]);
  const adminSet = new Set((admins ?? []).map((a) => a.email.toLowerCase()));
  const keepBrandIds = new Set((brands ?? []).filter((b) => GETIMG.test(b.company_name)).map((b) => b.id));
  const keepJobIds = new Set(
    (jobs ?? []).filter((j) => GETIMG.test(j.title) || (j.brand_account_id && keepBrandIds.has(j.brand_account_id))).map((j) => j.id),
  );
  const keepApplicantIds = new Set((assignments ?? []).filter((a) => keepJobIds.has(a.job_id)).map((a) => a.applicant_id));

  const accounts: CleanupAccount[] = users.map((u) => {
    const person = (applicants ?? []).find((a) => a.user_id === u.id);
    const brand = (brands ?? []).find((b) => b.user_id === u.id);
    const joined = person ? (assignments ?? []).filter((a) => a.applicant_id === person.id).length : 0;
    const own = brand ? (jobs ?? []).filter((j) => j.brand_account_id === brand.id).length : 0;
    let keptBecause: string | null = null;
    if (adminSet.has(u.email)) keptBecause = "Admin";
    else if (u.id === currentUserId) keptBecause = "You";
    else if (brand && keepBrandIds.has(brand.id)) keptBecause = "Getimg";
    else if (person && keepApplicantIds.has(person.id)) keptBecause = "On Getimg's campaign";
    const soft = keptBecause === "On Getimg's campaign";
    return {
      userId: u.id,
      email: u.email,
      kind: person ? "Creator" : brand ? "Brand" : "No profile",
      name: person?.name ?? brand?.company_name ?? "",
      detail: person ? `${joined} ${joined === 1 ? "campaign" : "campaigns"} joined` : brand ? `${own} ${own === 1 ? "campaign" : "campaigns"}` : "",
      keptBecause,
      soft,
    };
  });
  const campaigns: CleanupJob[] = (jobs ?? []).map((j) => ({
    id: j.id,
    title: j.title,
    creators: (assignments ?? []).filter((a) => a.job_id === j.id).length,
    keptBecause: keepJobIds.has(j.id) ? "Getimg" : null,
  }));
  return { accounts, campaigns, keepApplicantIds, keepJobIds };
}

type Db = ReturnType<typeof createAdminClient>;
// Tables that the generated types may not list; every call here is guarded and reports its own error.
const t = (db: Db, name: string) => (db as unknown as { from: (n: string) => ReturnType<Db["from"]> }).from(name);

/** Everything hanging off these assignments, then the assignments themselves. */
async function deleteAssignments(db: Db, ids: string[]): Promise<string | null> {
  if (ids.length === 0) return null;
  for (const table of ["assignment_posts", "direct_payments", "payouts", "balance_entries"]) {
    const { error } = await t(db, table).delete().in("assignment_id", ids);
    if (error) return `${table}: ${error.message}`;
  }
  const { error } = await db.from("assignments").delete().in("id", ids);
  return error ? `assignments: ${error.message}` : null;
}

export async function deleteJobCascade(db: Db, jobId: string): Promise<string | null> {
  const { data: rows } = await db.from("assignments").select("id").eq("job_id", jobId);
  const err = await deleteAssignments(db, (rows ?? []).map((r) => r.id));
  if (err) return err;
  const { error } = await db.from("jobs").delete().eq("id", jobId);
  return error ? `campaign: ${error.message}` : null;
}

/** One account and everything it made: creator work and money, brand profile, then the sign-in. */
export async function deleteAccountCascade(db: Db, userId: string): Promise<string | null> {
  const { data: person } = await db.from("applicants").select("id").eq("user_id", userId).maybeSingle();
  if (person) {
    const { data: rows } = await db.from("assignments").select("id").eq("applicant_id", person.id);
    const err = await deleteAssignments(db, (rows ?? []).map((r) => r.id));
    if (err) return err;
    for (const table of ["balance_entries", "withdrawals"]) {
      const { error } = await t(db, table).delete().eq("applicant_id", person.id);
      if (error) return `${table}: ${error.message}`;
    }
    const { error } = await db.from("applicants").delete().eq("id", person.id);
    if (error) return `creator profile: ${error.message}`;
  }
  const { data: brand } = await db.from("brand_accounts").select("id").eq("user_id", userId).maybeSingle();
  if (brand) {
    // Its campaigns stay (detached) unless they were picked for deletion on their own.
    const { error } = await db.from("brand_accounts").delete().eq("id", brand.id);
    if (error) return `brand profile: ${error.message}`;
  }
  const { error } = await db.auth.admin.deleteUser(userId);
  return error ? `sign-in: ${error.message}` : null;
}
