import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

/** The pay lines in the MePersona announcement, kept here so the plain-text version says exactly the same. */
export const MEPERSONA_PAY = [
  "$5 for every unique video",
  "$2 per 1,000 views, up to 100K views",
  "Rewards of $100, $300 or $500 when a video reaches 250K, 500K or 1M views",
  "Up to $705 per video, paid monthly",
];

/** Tells approved creators the MePersona campaign is open, with the pay, and sends them to apply. */
export function MePersonaAnnouncementEmail({ name, campaignUrl }: { name: string; campaignUrl: string }) {
  return (
    <EmailLayout preview="New campaign: MePersona. Up to $705 per video, paid monthly.">
      <EmailHeading>New campaign: MePersona</EmailHeading>
      <EmailText>Hi {name},</EmailText>
      <EmailText>
        A new paid campaign is open on OnCamera, and it&apos;s a good fit for creators.
      </EmailText>
      <EmailText>
        <strong>MePersona</strong> is an AI inbox for creators. It brings your comments and DMs into one place,
        drafts replies that sound like you, and schedules your posts across platforms. You make short videos about
        it on your own account.
      </EmailText>
      <EmailText>
        <strong>What you earn</strong>
        <br />
        {MEPERSONA_PAY.map((line) => (
          <span key={line}>
            &bull; {line}
            <br />
          </span>
        ))}
      </EmailText>
      <EmailText>
        The full brief has the scripts, hooks and example videos. To apply, send a short sample video.
      </EmailText>
      <EmailButton href={campaignUrl} align="center" tone="quiet">See the campaign</EmailButton>
      <div style={{ height: 16 }} />
      <EmailText>The OnCamera team</EmailText>
    </EmailLayout>
  );
}
