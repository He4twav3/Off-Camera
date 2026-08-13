import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailLinkFallback,
} from "./components/email-layout";

export function VerifyEmailEmail({ verifyUrl }: { verifyUrl: string }) {
  return (
    <EmailLayout preview="Verify your email to confirm your Off Camera account">
      <EmailHeading>Verify your email</EmailHeading>
      <EmailText>
        Welcome to Off Camera! Confirm this is really you so your account
        and lesson progress stay yours.
      </EmailText>
      <EmailButton href={verifyUrl}>Verify email</EmailButton>
      <EmailLinkFallback href={verifyUrl} />
      <EmailText>This link expires in 24 hours.</EmailText>
    </EmailLayout>
  );
}
