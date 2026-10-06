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
    <EmailLayout preview={`${payoutLabel} added to your balance`}>
      <EmailHeading>Your pay is ready, {name}</EmailHeading>
      <EmailText>
        We&apos;ve added <strong>{payoutLabel}</strong> for{" "}
        <strong>{jobTitle}</strong> to your balance.
      </EmailText>
      <EmailText>
        You can withdraw it from your Earnings page whenever you like. We pay
        withdrawals by bank transfer and email you when each one is sent.
      </EmailText>
      <EmailButton href={dashboardUrl}>Go to your earnings</EmailButton>
    </EmailLayout>
  );
}
