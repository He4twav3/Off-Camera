import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-guard";
import { programByKey, reportCsv } from "@/lib/affiliate-programs";
import { readCodes, resultsFor } from "@/lib/affiliate-codes";
import { createClient } from "@/lib/supabase/server";

/** The brand's report: every code given out, by number, with the creator's videos and views on its campaigns. */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const blocked = await adminGuard();
  if (blocked) return new NextResponse(blocked, { status: 403 });
  const program = programByKey((await ctx.params).key);
  if (!program) return new NextResponse("No such program.", { status: 404 });
  const codes = (await readCodes(program.key)).filter((c) => c.status !== "unused");
  const results = await resultsFor(program, [...new Set(codes.flatMap((c) => (c.applicantId ? [c.applicantId] : [])))]);
  const rows = codes.map((c) => ({ ...c, ...(c.applicantId ? results.get(c.applicantId) : undefined) ?? { posts: 0, views: 0 } }));
  await (await createClient()).rpc("log_admin_action", { p_action: "affiliate_report_downloaded", p_target: program.key });
  return new NextResponse(reportCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${program.key}-partner-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
