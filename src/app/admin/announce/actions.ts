"use server";

import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/admin-guard";
import { getBaseUrl } from "@/lib/request-url";
import { sendMePersonaAnnouncementEmail } from "@/lib/email/notifications";
import {
  MEPERSONA_ANNOUNCEMENT,
  approvedCreators,
  mePersonaCampaignUrl,
  saveSentTo,
  sentTo,
} from "@/lib/announcements";

export interface AnnounceState {
  error?: string;
  done?: { sent: number; failed: number; left: number };
}

// Resend takes about two emails a second; stop well before the request's time limit and say how many are left.
const GAP_MS = 600;
const BUDGET_MS = 240_000;

/**
 * Sends the MePersona announcement to every approved creator who hasn't had it. Each address is saved as sent
 * as soon as it goes, so pressing again carries on where this left off and never sends anyone a second copy.
 */
export async function sendMePersonaAnnouncementAction(_prev: AnnounceState, formData: FormData): Promise<AnnounceState> {
  if (formData.get("confirm") !== "SEND") return { error: "Type SEND in capitals to confirm." };
  const blocked = await adminGuard();
  if (blocked) return { error: blocked };

  const started = Date.now();
  const done = await sentTo(MEPERSONA_ANNOUNCEMENT);
  const waiting = (await approvedCreators()).filter((r) => !done.has(r.email));
  const url = await mePersonaCampaignUrl(await getBaseUrl());

  let sent = 0;
  let failed = 0;
  for (const r of waiting) {
    if (Date.now() - started > BUDGET_MS) break;
    const { delivery } = await sendMePersonaAnnouncementEmail(r.email, r.name, url);
    if (delivery === "sent") {
      sent++;
      done.add(r.email);
      await saveSentTo(MEPERSONA_ANNOUNCEMENT, done);
    } else {
      failed++;
    }
    await new Promise((resolve) => setTimeout(resolve, GAP_MS));
  }

  revalidatePath("/admin/announce");
  return { done: { sent, failed, left: waiting.length - sent } };
}
