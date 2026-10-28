import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { readBankDetails, readWiseTemplate } from "@/lib/payout-details-store";
import { buildBatchCsv, mergeByCreator, readTemplate } from "@/lib/wise-batch";

export type WiseBatch = {
  csv: string;
  /** Statements in the file. */
  statementIds: string[];
  /** Creators in the file, and the total in USD. */
  creators: number;
  total: number;
  /** Owed, but left out because the creator hasn't added bank details yet. */
  missing: { name: string; amount: number }[];
  /** Columns in the brand's template we don't fill (blank in the file). */
  unknownColumns: string[];
  usesTemplate: boolean;
};

/** Everything the brand still has to pay, as a Wise "Send to bank accounts" file. */
export async function buildWiseBatch(brandId: string): Promise<WiseBatch> {
  const { data } = await createAdminClient()
    .from("direct_payments")
    .select("id, amount, brand_paid_at, creator_confirmed_at, assignments!inner(applicant_id, applicants(name, email), jobs!inner(brand_account_id))")
    .eq("assignments.jobs.brand_account_id", brandId)
    .is("brand_paid_at", null)
    .is("creator_confirmed_at", null);

  const open = (data ?? []).filter((r) => r.assignments?.jobs?.brand_account_id === brandId);
  const items: { statementId: string; applicantId: string; amount: number; reference: string; details: NonNullable<Awaited<ReturnType<typeof readBankDetails>>> }[] = [];
  const missing: WiseBatch["missing"] = [];
  const detailsCache = new Map<string, Awaited<ReturnType<typeof readBankDetails>>>();
  for (const r of open) {
    const applicantId = r.assignments!.applicant_id;
    if (!detailsCache.has(applicantId)) detailsCache.set(applicantId, await readBankDetails(applicantId));
    const details = detailsCache.get(applicantId);
    const amount = Number(r.amount);
    if (!details) {
      missing.push({ name: r.assignments?.applicants?.name ?? "A creator", amount });
      continue;
    }
    // The creator's sign-in email, so Wise can tell them the money is coming.
    items.push({ statementId: r.id, applicantId, amount, reference: "OnCamera payout", details: { ...details, email: r.assignments?.applicants?.email ?? details.email } });
  }

  const template = await readWiseTemplate(brandId);
  const parsed = template ? readTemplate(template) : null;
  const header = parsed?.ok ? parsed.header : undefined;
  const rows = mergeByCreator(items);
  return {
    csv: buildBatchCsv(rows, header),
    statementIds: items.map((i) => i.statementId),
    creators: rows.length,
    total: Math.round(rows.reduce((n, r) => n + r.amount * 100, 0)) / 100,
    missing,
    unknownColumns: parsed?.ok ? parsed.unknown : [],
    usesTemplate: Boolean(header),
  };
}
