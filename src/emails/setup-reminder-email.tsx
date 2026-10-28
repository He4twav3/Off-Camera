import { Link } from "@react-email/components";
import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

/** The three setup reminders, in order: subject, preview line, heading, the lines of the email and the button. */
export const SETUP_REMINDERS = [
  {
    subject: "Brands are paying creators like you right now",
    heading: "Your first paid video is closer than you think",
    lines: [
      "Brands on OnCamera are paying creators to post on their own pages: money for every video, and more as your views take off. No pitching brands, no chasing invoices.",
      "All that's left is connecting your TikTok, Instagram or YouTube. Do it now and you can apply to a campaign today.",
    ],
    button: "Connect my account",
  },
  {
    subject: "Here's how creators get paid for every view",
    heading: "Post. Get views. Get paid.",
    lines: [
      "1. Pick a campaign you like\n2. Post the video on your own page\n3. Get paid for the video, plus extra as the views roll in",
      "One video that takes off keeps paying as the views climb. You're one click away from starting.",
    ],
    button: "Start earning",
  },
  {
    subject: "Creators are getting paid this month. You could be next",
    heading: "You're so close",
    lines: [
      "Right now, creators on OnCamera are posting videos and getting paid for every one, with extra as the views come in.",
      "You've already done the hard part by signing up. Connect your account and your next video could be a paid one.",
    ],
    button: "Connect and start earning",
  },
];

/** One setup reminder to a creator, in the plain white layout, with an unsubscribe link at the bottom. */
export function SetupReminderEmail({ step, name, url, unsubscribeUrl }: { step: number; name: string; url: string; unsubscribeUrl: string }) {
  const r = SETUP_REMINDERS[step];
  return (
    <EmailLayout plain preview={r.lines[0].split("\n")[0]}>
      <EmailHeading plain>{r.heading}</EmailHeading>
      <EmailText plain>Hi {name},</EmailText>
      {r.lines.map((line) => (
        <EmailText plain key={line}>
          {line.split("\n").map((part, i) => (
            <span key={part}>
              {i > 0 && <br />}
              {part}
            </span>
          ))}
        </EmailText>
      ))}
      <EmailButton href={url} align="center" tone="quiet" plain>
        {r.button}
      </EmailButton>
      <div style={{ height: 16 }} />
      <EmailText plain>The OnCamera team</EmailText>
      <EmailText plain>
        <Link href={unsubscribeUrl} style={{ color: "#8a8690", fontSize: 12 }}>
          Unsubscribe from these emails
        </Link>
      </EmailText>
    </EmailLayout>
  );
}
