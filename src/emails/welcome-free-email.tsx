import { EmailLayout, EmailHeading, EmailButton } from "./components/email-layout";

/**
 * Sent from the free /signup flow and the login page's "Email me a sign-in
 * link" (see app/signup/actions.ts) — a passwordless magic link. Kept to a
 * heading and one button on purpose; the link expires in 24 hours.
 */
export function WelcomeFreeEmail({ claimUrl }: { claimUrl: string }) {
  return (
    <EmailLayout preview="You're in — sign in to start On Camera">
      <EmailHeading align="center">You&apos;re in</EmailHeading>
      <EmailButton href={claimUrl} align="center">
        Sign in
      </EmailButton>
    </EmailLayout>
  );
}
