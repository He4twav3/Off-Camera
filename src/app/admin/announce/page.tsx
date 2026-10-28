import type { Metadata } from "next";
import { requireAdminMfa } from "@/lib/admin-mfa";
import { adminGuard } from "@/lib/admin-guard";
import { MEPERSONA_ANNOUNCEMENT, approvedCreators, sentTo } from "@/lib/announcements";
import { AnnounceForm } from "./AnnounceForm";

export const metadata: Metadata = { title: "Announcements · Admin" };
// Sending runs a few minutes for a long list (see actions.ts).
export const maxDuration = 300;

export default async function AdminAnnouncePage() {
  await requireAdminMfa("/admin/announce");
  const blocked = await adminGuard();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-5 sm:py-8">
      <h1 className="font-heading text-2xl font-semibold text-foreground">Announcements</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Email every approved creator about a new campaign. Each creator gets it once, however many times you press Send.
      </p>
      {blocked ? (
        <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">{blocked}</p>
      ) : (
        <Loaded />
      )}
    </div>
  );
}

async function Loaded() {
  const [creators, done] = await Promise.all([approvedCreators(), sentTo(MEPERSONA_ANNOUNCEMENT)]);
  const waiting = creators.filter((c) => !done.has(c.email)).length;
  return (
    <section className="rounded-xl border border-border/70 bg-card p-5">
      <h2 className="font-heading text-base font-semibold text-foreground">New campaign: MePersona</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Subject: &ldquo;New campaign: MePersona, up to $705 per video&rdquo;. From OnCamera, with the pay and a
        button to the campaign.
      </p>
      <p className="mt-4 text-sm text-foreground">
        <strong>{creators.length}</strong> approved creators · <strong>{creators.length - waiting}</strong> already sent ·{" "}
        <strong>{waiting}</strong> to send
      </p>
      <div className="mt-4">
        {waiting === 0 ? (
          <p className="text-sm text-muted-foreground">Everyone has it.</p>
        ) : (
          <AnnounceForm waiting={waiting} />
        )}
      </div>
    </section>
  );
}
