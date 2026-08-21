import { EmailLayout, EmailHeading, EmailText } from "./components/email-layout";

export function ApplicantRejectedEmail({ name }: { name: string }) {
  return (
    <EmailLayout preview="Update on your Off Camera application">
      <EmailHeading>Thanks for applying, {name}</EmailHeading>
      <EmailText>
        We&apos;ve reviewed your profile and it isn&apos;t a fit for the
        campaigns we&apos;re running right now.
      </EmailText>
      <EmailText>
        This isn&apos;t necessarily permanent — the campaigns we source
        change regularly. You&apos;re welcome to reply to this email if
        you&apos;d like us to take another look.
      </EmailText>
    </EmailLayout>
  );
}
