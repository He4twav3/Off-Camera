import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { creditProgramByKey, creditsCsv, waiting } from "@/lib/tool-credits";
import { readRequests } from "@/lib/tool-credits-store";

/** The list to send the brand: every account still waiting for credits. `?all=1` gives everyone, sent or not. */
export async function GET(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const blocked = await adminGuard();
  if (blocked) return new NextResponse(blocked, { status: 403 });
  const program = creditProgramByKey((await ctx.params).key);
  if (!program) return new NextResponse("No such program.", { status: 404 });
  const all = new URL(req.url).searchParams.get("all") === "1";
  const list = await readRequests(program.key);
  const rows = all ? [...list].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)) : waiting(list);
  await (await createClient()).rpc("log_admin_action", { p_action: "tool_credits_list_downloaded", p_target: program.key });
  return new NextResponse(creditsCsv(program, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${program.key}-credits-${all ? "all" : "to-send"}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
