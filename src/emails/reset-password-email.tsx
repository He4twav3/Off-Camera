import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailLinkFallback,
} from "./components/email-layout";

export function ResetPasswordEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <EmailLayout preview="Reset your On Camera password">
      <EmailHeading>Reset your password</EmailHeading>
      <EmailText>
        We got a request to reset the password on your On Camera account.
        If that was you, set a new one below.
      </EmailText>
      <EmailButton href={resetUrl}>Reset password</EmailButton>
      <EmailLinkFallback href={resetUrl} />
      <EmailText>
        This link expires in 1 hour. If you didn&apos;t request this, you
        can safely ignore this email — your password won&apos;t change.
      </EmailText>
    </EmailLayout>
  );
}
