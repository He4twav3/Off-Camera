import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePostTerms } from "@/lib/post-terms";
import { contractSections, contractWordHtml } from "@/lib/contract";

/** A campaign's contract as a Word file, for admins. Runs as the signed-in admin, so the database's own rules decide. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return new NextResponse("Not found", { status: 404 });
  const { data: job } = await supabase.from("jobs").select("title, post_terms").eq("id", id).maybeSingle();
  const terms = job ? parsePostTerms(job.post_terms) : null;
  if (!job || !terms) return new NextResponse("Not found", { status: 404 });

  const c = terms.contract;
  const html = contractWordHtml({
    title: `Campaign contract: ${job.title}`,
    sections: contractSections({ campaign: job.title, agency: "OnCamera", terms, brand: c }),
    signedLine: c ? `Agreed by ${c.signatory} (${c.agreedByEmail}) on ${c.agreedAt.slice(0, 10)}.` : null,
  });
  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/msword; charset=utf-8",
      "Content-Disposition": `attachment; filename="oncamera-contract.doc"`,
      "Cache-Control": "no-store",
    },
  });
}
