import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailLinkFallback,
} from "./components/email-layout";

export function WelcomePurchaseEmail({ claimUrl }: { claimUrl: string }) {
  return (
    <EmailLayout preview="You're in — sign in to start On Camera">
      <EmailHeading>You&apos;re in</EmailHeading>
      <EmailText>
        Your payment went through and your account is ready. This link
        signs you in and confirms it&apos;s really you — no password
        needed.
      </EmailText>
      <EmailButton href={claimUrl}>Sign in &amp; start the course</EmailButton>
      <EmailLinkFallback href={claimUrl} />
      <EmailText>This link expires in 24 hours.</EmailText>
    </EmailLayout>
  );
}
