import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

export function WithdrawalConfirmEmail({
  name,
  amountLabel,
  last4,
  confirmUrl,
  holdHours,
}: {
  name: string;
  amountLabel: string;
  last4: string;
  confirmUrl: string;
  holdHours: number;
}) {
  return (
    <EmailLayout preview={`Confirm your ${amountLabel} withdrawal`}>
      <EmailHeading>Confirm your withdrawal, {name}</EmailHeading>
      <EmailText>
        Someone asked to withdraw <strong>{amountLabel}</strong> to the account
        ending <strong>{last4 || "…"}</strong>. If that was you, confirm it
        below. The link works for 24 hours.
      </EmailText>
      <EmailButton href={confirmUrl}>Confirm withdrawal</EmailButton>
      <EmailText>
        After you confirm, we wait {holdHours} hours before paying, as a safety
        check. You can cancel at any time before then from your Earnings page.
      </EmailText>
      <EmailText>
        <strong>Wasn&apos;t you?</strong> Don&apos;t click the button. The request
        expires by itself and the money stays in your balance. Please also
        change your password and reply to this email.
      </EmailText>
    </EmailLayout>
  );
}
