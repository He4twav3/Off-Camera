import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

export function ApplicationAcceptedEmail({
  name,
  jobTitle,
  dashboardUrl,
}: {
  name: string;
  jobTitle: string;
  dashboardUrl: string;
}) {
  return (
    <EmailLayout preview={`You got it — ${jobTitle}`}>
      <EmailHeading>Good news, {name}</EmailHeading>
      <EmailText>
        We&apos;ve accepted your application for <strong>{jobTitle}</strong>.
      </EmailText>
      <EmailText>
        Your dashboard has the payout amount, the brief, and where to submit
        your post when it&apos;s live.
      </EmailText>
      <EmailButton href={dashboardUrl}>Open your dashboard</EmailButton>
    </EmailLayout>
  );
}
