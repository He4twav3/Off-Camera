import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadReleaseCandidates } from "@/lib/auto-release-data";
import { planRelease } from "@/lib/auto-release";
import { sendPayoutPaidEmail } from "@/lib/email/notifications";

// Daily, after the view counts refresh (see vercel.json). Releases earnings to
// creators' balances for approved posts once the brand has paid and, for
// view-based pay, the measurement window has ended. This is bookkeeping only:
// no money moves until an admin sends the bank transfer. Anything unusual is
// left alone and shows up on the admin Payouts page.
//
// Vercel sends `Authorization: Bearer $CRON_SECRET`; with no CRON_SECRET set the
// route refuses everything.
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const candidates = await loadReleaseCandidates(db);

  let released = 0;
  let waiting = 0;
  let attention = 0;
  const problems: string[] = [];

  for (const c of candidates) {
    const plan = planRelease(c.input);
    if (plan.kind === "wait") {
      waiting++;
      continue;
    }
    if (plan.kind === "attention") {
      attention++;
      continue;
    }

    // The database re-checks every rule (approved, brand paid, not more than the
    // brand paid, each stage once) and refuses anything that doesn't hold.
    const { data: done, error } = await db.rpc("release_earning", {
      p_assignment: c.assignmentId,
      p_stage: plan.stage,
      p_amount: plan.amount,
      p_final: plan.final,
      p_note: plan.note,
    });
    if (error) {
      problems.push(`${c.assignmentId}: ${error.message}`);
      continue;
    }
    if (!done) continue; // already released by an earlier run

    released++;
    if (c.applicant) {
      await sendPayoutPaidEmail(c.applicant.email, c.applicant.name, c.jobTitle, plan.amount);
    }
  }

  return NextResponse.json({ checked: candidates.length, released, waiting, attention, problems });
}
