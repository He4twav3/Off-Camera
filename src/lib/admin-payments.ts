import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminGuard } from "@/lib/admin-guard";
import { getAdminWorkspace } from "@/lib/admin-workspace";

/**
 * The payments that still need money or emails: every issued statement the creator hasn't confirmed, with who
 * owes whom, the creator's payment link, the brand's contact, and whether each email has been sent (and by whom).
 * "Sent" is recorded in the admin audit log, so two admins can see at once that it has been done.
 */
export type Sent = { by: string; at: string };

export type OpenPayment = {
  statementId: string;
  cycle: number;
  amount: number;
  dueAt: string;
  campaignId: string;
  campaignTitle: string;
  brandId: string | null;
  brandName: string | null;
  creator: { applicantId: string; assignmentId: string; name: string; email: string; payTo: string | null; provider: string | null };
  brandSent: Sent | null;
  creatorSent: Sent | null;
};

export type BrandContact = { id: string; company: string; contactName: string; email: string | null };

export const EMAILED_BRAND = "emailed_brand";
export const EMAILED_CREATOR = "emailed_creator";
/** Undoing a "sent" is a later entry in the log, so the log itself is never edited. */
export const UNSENT_BRAND = "unsent_brand";
export const UNSENT_CREATOR = "unsent_creator";

/** Which payment emails have been sent, keyed "emailed_brand:<statement id>". One cheap lookup, used by the menu counts too. */
export const getSent = cache(async (): Promise<{ sent: Map<string, Sent>; ids: string[]; auditAvailable: boolean }> => {
  const ws = await getAdminWorkspace();
  const supabase = await createClient();
  const ids = ws.campaigns.flatMap((c) => c.creators.flatMap((cr) => cr.statements.filter((s) => s.state !== "confirmed").map((s) => s.id)));
  const sent = new Map<string, Sent>();
  let auditAvailable = true;
  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("admin_audit")
      .select("action, target_id, admin_email, created_at")
      .in("action", [EMAILED_BRAND, EMAILED_CREATOR, UNSENT_BRAND, UNSENT_CREATOR])
      .in("target_id", ids)
      .order("created_at", { ascending: true });
    if (error) auditAvailable = false;
    for (const row of data ?? []) {
      const undone = row.action === UNSENT_BRAND || row.action === UNSENT_CREATOR;
      const key = `${undone ? row.action.replace("unsent_", "emailed_") : row.action}:${row.target_id}`;
      if (undone) sent.delete(key);
      else sent.set(key, { by: row.admin_email, at: row.created_at });
    }
  }
  return { sent, ids, auditAvailable };
});

export const getPayments = cache(async (): Promise<{ payments: OpenPayment[]; brands: Map<string, BrandContact>; auditAvailable: boolean }> => {
  const ws = await getAdminWorkspace();
  const supabase = await createClient();

  const open = ws.campaigns.flatMap((c) =>
    c.creators.flatMap((cr) =>
      cr.statements
        .filter((s) => s.state !== "confirmed")
        .map((s) => ({ c, cr, s })),
    ),
  );

  const { sent, auditAvailable } = await getSent();

  // The brand's contact: name from the account, email from its sign-in (needs the service role, so only after the admin check).
  const brandIds = [...new Set(open.map((o) => o.c.brandId).filter(Boolean) as string[])];
  const brands = new Map<string, BrandContact>();
  if (brandIds.length > 0) {
    const { data: rows } = await supabase.from("brand_accounts").select("id, company_name, contact_name, user_id").in("id", brandIds);
    const allowed = (await adminGuard()) === null;
    const db = allowed ? createAdminClient() : null;
    for (const b of rows ?? []) {
      let email: string | null = null;
      if (db && b.user_id) email = (await db.auth.admin.getUserById(b.user_id)).data.user?.email ?? null;
      brands.set(b.id, { id: b.id, company: b.company_name, contactName: b.contact_name, email });
    }
  }

  const payments: OpenPayment[] = open.map(({ c, cr, s }) => ({
    statementId: s.id,
    cycle: s.cycle,
    amount: s.amount,
    dueAt: s.dueAt,
    campaignId: c.id,
    campaignTitle: c.title,
    brandId: c.brandId,
    brandName: c.brandName,
    creator: {
      applicantId: cr.applicantId,
      assignmentId: cr.assignmentId,
      name: cr.name,
      email: cr.email,
      payTo: cr.payout.link ?? cr.payout.raw,
      provider: cr.payout.provider,
    },
    brandSent: sent.get(`${EMAILED_BRAND}:${s.id}`) ?? null,
    creatorSent: sent.get(`${EMAILED_CREATOR}:${s.id}`) ?? null,
  }));
  return { payments, brands, auditAvailable };
});
