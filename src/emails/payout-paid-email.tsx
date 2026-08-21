import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

export function PayoutPaidEmail({
  name,
  jobTitle,
  payoutLabel,
  dashboardUrl,
}: {
  name: string;
  jobTitle: string;
  payoutLabel: string;
  dashboardUrl: string;
}) {
  return (
    <EmailLayout preview={`Payment sent — ${payoutLabel}`}>
      <EmailHeading>Your payment is on its way, {name}</EmailHeading>
      <EmailText>
        We&apos;ve sent <strong>{payoutLabel}</strong> for{" "}
        <strong>{jobTitle}</strong>.
      </EmailText>
      <EmailText>
        Depending on the payment method, it can take a little time to land.
        If you don&apos;t see it in a few days, reply to this email.
      </EmailText>
      <EmailButton href={dashboardUrl}>View your dashboard</EmailButton>
    </EmailLayout>
  );
}
