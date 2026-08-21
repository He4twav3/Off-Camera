import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

export function AssignmentEmail({
  name,
  jobTitle,
  payoutLabel,
  dashboardUrl,
}: {
  name: string;
  jobTitle: string;
  /** Already formatted (e.g. "$150") — this template never sees a raw number. */
  payoutLabel: string;
  dashboardUrl: string;
}) {
  return (
    <EmailLayout preview={`You've been assigned: ${jobTitle}`}>
      <EmailHeading>You&apos;re on a campaign, {name}</EmailHeading>
      <EmailText>
        You&apos;ve been assigned to <strong>{jobTitle}</strong>.
      </EmailText>
      <EmailText>
        Your payout for this assignment is <strong>{payoutLabel}</strong>.
      </EmailText>
      <EmailText>
        Your dashboard has the brief and the link to the instructions. Once
        your post is live, paste the URL into your dashboard so we can verify
        it and release payment.
      </EmailText>
      <EmailButton href={dashboardUrl}>Open your dashboard</EmailButton>
    </EmailLayout>
  );
}
