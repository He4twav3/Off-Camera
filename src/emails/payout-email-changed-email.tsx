import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

export function PayoutEmailChangedEmail({
  name,
  hint,
  earningsUrl,
}: {
  name: string;
  hint: string;
  earningsUrl: string;
}) {
  return (
    <EmailLayout preview="Your payout email was changed">
      <EmailHeading>Your payout email was changed, {name}</EmailHeading>
      <EmailText>
        The email we pay you through now starts with <strong>{hint || "…"}…</strong>. Because it&apos;s new, your next
        withdrawal to it needs to be confirmed from an email link and waits 72 hours before we send it.
      </EmailText>
      <EmailText>
        <strong>Wasn&apos;t you?</strong> Change your password, remove the saved email on your Earnings page, and reply to
        this email so we can freeze withdrawals while we check.
      </EmailText>
      <EmailButton href={earningsUrl}>Open your earnings</EmailButton>
    </EmailLayout>
  );
}
