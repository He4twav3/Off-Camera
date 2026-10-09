import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBrandStatements } from "@/lib/direct-pay-data";
import { statementState } from "@/lib/direct-pay";
import { toCsv } from "@/lib/csv";

/** The brand's payments as a spreadsheet: one row per payment. Only the signed-in brand's own (RLS on its account row). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Not signed in", { status: 401 });
  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand || brand.status !== "approved") return new NextResponse("Not found", { status: 404 });

  const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
  const rows = (await getBrandStatements(brand.id)).map((s) => [
    day(s.issued_at),
    s.creatorName,
    s.campaign,
    s.amount.toFixed(2),
    "USD",
    day(s.due_at),
    day(s.brand_paid_at),
    day(s.creator_confirmed_at),
    statementState(s),
  ]);
  const csv = toCsv([["Issued", "Creator", "Campaign", "Amount", "Currency", "Due", "Paid", "Creator confirmed", "Status"], ...rows]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="oncamera-payments.csv"',
      "Cache-Control": "no-store",
    },
  });
}
