import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

export function WithdrawalConfirmedEmail({
  name,
  amountLabel,
  last4,
  earliest,
  earningsUrl,
}: {
  name: string;
  amountLabel: string;
  last4: string;
  earliest: string;
  earningsUrl: string;
}) {
  return (
    <EmailLayout preview={`Your ${amountLabel} withdrawal is confirmed`}>
      <EmailHeading>Withdrawal confirmed, {name}</EmailHeading>
      <EmailText>
        We&apos;ll pay <strong>{amountLabel}</strong> to the email starting{" "}
        <strong>{last4 || "…"}…</strong> no earlier than <strong>{earliest}</strong>.
      </EmailText>
      <EmailText>
        <strong>Wasn&apos;t you?</strong> Cancel it now from your Earnings page
        and the money goes straight back to your balance. Then change your
        password and reply to this email.
      </EmailText>
      <EmailButton href={earningsUrl}>Open your earnings</EmailButton>
    </EmailLayout>
  );
}
