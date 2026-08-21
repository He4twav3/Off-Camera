import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

export function ApplicationDeclinedEmail({
  name,
  jobTitle,
  jobsUrl,
}: {
  name: string;
  jobTitle: string;
  jobsUrl: string;
}) {
  return (
    <EmailLayout preview={`Update on your application — ${jobTitle}`}>
      <EmailHeading>Thanks for applying, {name}</EmailHeading>
      <EmailText>
        We went with someone else for <strong>{jobTitle}</strong>.
      </EmailText>
      <EmailText>
        This doesn&apos;t count against you for anything else — your profile
        stays active and you can apply to any other open campaign.
      </EmailText>
      <EmailButton href={jobsUrl}>See what else is open</EmailButton>
    </EmailLayout>
  );
}
