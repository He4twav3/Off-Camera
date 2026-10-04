import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
} from "./components/email-layout";

/**
 * Sent from the free /signup flow and the login page's "Email me a sign-in
 * link" (see app/signup/actions.ts) — a passwordless magic link. No pasted
 * fallback URL: the raw Supabase verify link is long and ugly, and the
 * button is the way in.
 */
export function WelcomeFreeEmail({ claimUrl }: { claimUrl: string }) {
  return (
    <EmailLayout preview="You're in — sign in to start On Camera">
      <EmailHeading align="center">You&apos;re in</EmailHeading>
      <EmailText align="center">
        Your spot is saved and your account is ready. This link signs
        you in and confirms it&apos;s really you — no password needed.
      </EmailText>
      <EmailButton href={claimUrl} align="center">
        Sign in &amp; start the course
      </EmailButton>
      <EmailText align="center">This link expires in 24 hours.</EmailText>
    </EmailLayout>
  );
}
