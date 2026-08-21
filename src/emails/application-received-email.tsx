import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

// Sent to the admin inbox (ADMIN_NOTIFY_EMAIL), not the applicant — a nudge
// that there's something in the review queue.
export function ApplicationReceivedEmail({
  applicantName,
  jobTitle,
  reviewUrl,
}: {
  applicantName: string;
  jobTitle: string;
  reviewUrl: string;
}) {
  return (
    <EmailLayout preview={`New application: ${jobTitle}`}>
      <EmailHeading>You have a new application</EmailHeading>
      <EmailText>
        <strong>{applicantName}</strong> applied for{" "}
        <strong>{jobTitle}</strong>.
      </EmailText>
      <EmailText>Their profile card is on the applications screen.</EmailText>
      <EmailButton href={reviewUrl}>Review it</EmailButton>
    </EmailLayout>
  );
}
