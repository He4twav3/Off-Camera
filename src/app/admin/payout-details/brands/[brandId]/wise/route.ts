import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-guard";
import { buildWiseBatch } from "@/lib/wise-batch-data";
import { saveLastBatch } from "@/lib/payout-details-store";
import { createClient } from "@/lib/supabase/server";

/** The brand's Wise payment file, for admin to send to the brand. Admins with two-step sign-in only. */
export async function GET(_req: Request, ctx: { params: Promise<{ brandId: string }> }) {
  const blocked = await adminGuard();
  if (blocked) return new NextResponse(blocked, { status: 403 });
  const { brandId } = await ctx.params;
  const batch = await buildWiseBatch(brandId);
  if (batch.statementIds.length === 0) return new NextResponse("This brand has nothing to pay right now.", { status: 404 });
  await saveLastBatch(brandId, { statementIds: batch.statementIds, total: batch.total, createdAt: new Date().toISOString() });
  const supabase = await createClient();
  await supabase.rpc("log_admin_action", { p_action: "wise_file_downloaded", p_target: brandId });
  return new NextResponse(batch.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wise-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
