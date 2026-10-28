import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildWiseBatch } from "@/lib/wise-batch-data";
import { saveLastBatch } from "@/lib/payout-details-store";

/** The Wise payment file for everything this brand still owes. Only the signed-in brand's own (RLS on its account row). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Not signed in", { status: 401 });
  const { data: brand } = await supabase.from("brand_accounts").select("id, status").eq("user_id", user.id).maybeSingle();
  if (!brand || brand.status !== "approved") return new NextResponse("Not found", { status: 404 });

  const batch = await buildWiseBatch(brand.id);
  if (batch.statementIds.length === 0) return new NextResponse("Nothing to pay right now.", { status: 404 });
  await saveLastBatch(brand.id, { statementIds: batch.statementIds, total: batch.total, createdAt: new Date().toISOString() });
  return new NextResponse(batch.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wise-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
