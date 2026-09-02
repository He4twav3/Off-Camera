import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailLinkFallback,
} from "./components/email-layout";

/**
 * Sent from the free /signup flow (see app/signup/actions.ts) — a
 * passwordless magic-link account, same pattern as the real-purchase
 * welcome email (welcome-purchase-email.tsx), just without the "your
 * payment went through" framing since no payment happened here.
 */
export function WelcomeFreeEmail({ claimUrl }: { claimUrl: string }) {
  return (
    <EmailLayout preview="You're in — sign in to start On Camera">
      <EmailHeading>You&apos;re in</EmailHeading>
      <EmailText>
        Your spot is saved and your account is ready. This link signs
        you in and confirms it&apos;s really you — no password needed.
      </EmailText>
      <EmailButton href={claimUrl}>Sign in &amp; start the course</EmailButton>
      <EmailLinkFallback href={claimUrl} />
      <EmailText>This link expires in 24 hours.</EmailText>
    </EmailLayout>
  );
}
