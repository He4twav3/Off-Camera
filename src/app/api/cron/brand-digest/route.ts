import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBrandWorkspace } from "@/lib/brand-workspace";
import { digest } from "@/lib/brand-digest";
import { sendEmail } from "@/lib/mailer";
import { BrandApprovalsEmail } from "@/emails/brand-approvals-email";
import { discordOrigin } from "@/lib/discord";

// Daily (see vercel.json): tells each brand that approves its own videos how many are waiting.
// Brands that let OnCamera approve get nothing. Same CRON_SECRET guard as the other cron.
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: brands } = await db
    .from("brand_accounts")
    .select("id, user_id, contact_name")
    .eq("status", "approved");

  const url = `${discordOrigin(request.url).replace(/\/+$/, "")}/brand/approvals`;
  const deadline = Date.now() + 50_000;
  let sent = 0;
  for (const b of brands ?? []) {
    if (Date.now() > deadline) break;
    const ws = await loadBrandWorkspace(b.id);
    const items = ws.campaigns
      .filter((c) => c.reviewer === "brand")
      .map((c) => ({ campaign: c.title, count: c.awaitingReview }))
      .filter((i) => i.count > 0);
    const note = digest({ contactName: b.contact_name, items, url });
    if (!note) continue;
    const { data: auth } = await db.auth.admin.getUserById(b.user_id);
    const to = auth.user?.email;
    if (!to) continue;
    await sendEmail({
      to,
      subject: note.subject,
      react: BrandApprovalsEmail({ name: b.contact_name, items, url }),
      text: note.text,
    });
    sent++;
  }
  return NextResponse.json({ brands: brands?.length ?? 0, sent });
}
