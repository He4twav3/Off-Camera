import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

export function WithdrawalPaidEmail({
  name,
  amountLabel,
  earningsUrl,
}: {
  name: string;
  amountLabel: string;
  earningsUrl: string;
}) {
  return (
    <EmailLayout preview={`Your ${amountLabel} withdrawal has been sent`}>
      <EmailHeading>Your withdrawal has been sent, {name}</EmailHeading>
      <EmailText>
        We&apos;ve sent <strong>{amountLabel}</strong> by bank transfer. Depending
        on your bank it can take a little time to land. If you don&apos;t see it
        in a few days, reply to this email.
      </EmailText>
      <EmailButton href={earningsUrl}>View your earnings</EmailButton>
    </EmailLayout>
  );
}
