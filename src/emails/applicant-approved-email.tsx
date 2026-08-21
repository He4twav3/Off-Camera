import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

export function ApplicantApprovedEmail({
  name,
  dashboardUrl,
}: {
  name: string;
  dashboardUrl: string;
}) {
  return (
    <EmailLayout preview="You're approved — you're in the creator pool">
      <EmailHeading>You&apos;re approved, {name}</EmailHeading>
      <EmailText>
        Your profile has been reviewed and approved. You&apos;re now eligible
        to be matched with paid campaigns.
      </EmailText>
      <EmailText>
        We assign creators to campaigns by hand based on platform, niche, and
        your preferred rate. When you&apos;re matched, you&apos;ll get an
        email and it&apos;ll show up on your dashboard.
      </EmailText>
      <EmailButton href={dashboardUrl}>View your dashboard</EmailButton>
    </EmailLayout>
  );
}
