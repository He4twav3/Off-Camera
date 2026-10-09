import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePostTerms } from "@/lib/post-terms";
import { contractSections, contractWordHtml } from "@/lib/contract";

/** The brand's own campaign contract as a Word file. Only for the signed-in brand that owns the campaign. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Not signed in", { status: 401 });
  const { data: brand } = await supabase.from("brand_accounts").select("id, status").eq("user_id", user.id).maybeSingle();
  if (!brand || brand.status !== "approved") return new NextResponse("Not found", { status: 404 });

  const { data: job } = await createAdminClient()
    .from("jobs")
    .select("title, post_terms, brand_account_id")
    .eq("id", id)
    .maybeSingle();
  const terms = job ? parsePostTerms(job.post_terms) : null;
  if (!job || !terms || job.brand_account_id !== brand.id) return new NextResponse("Not found", { status: 404 });

  const c = terms.contract;
  const html = contractWordHtml({
    title: `Campaign contract: ${job.title}`,
    sections: contractSections({ campaign: job.title, agency: "OnCamera", terms, brand: c }),
    signedLine: c ? `Agreed by ${c.signatory} on ${c.agreedAt.slice(0, 10)}.` : null,
  });
  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/msword; charset=utf-8",
      "Content-Disposition": `attachment; filename="oncamera-contract.doc"`,
      "Cache-Control": "no-store",
    },
  });
}
