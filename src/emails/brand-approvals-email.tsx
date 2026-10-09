import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

// Daily note to a brand that approves its own videos (see lib/brand-digest.ts).
export function BrandApprovalsEmail({
  name,
  items,
  url,
}: {
  name: string;
  items: { campaign: string; count: number }[];
  url: string;
}) {
  const total = items.reduce((n, i) => n + i.count, 0);
  return (
    <EmailLayout preview={`${total} ${total === 1 ? "video is" : "videos are"} waiting for your approval`}>
      <EmailHeading>Videos are waiting for you</EmailHeading>
      <EmailText>Hi {name.trim().split(/\s+/)[0] || "there"},</EmailText>
      {items.map((i) => (
        <EmailText key={i.campaign}>
          <strong>{i.campaign}</strong>: {i.count} {i.count === 1 ? "video" : "videos"}
        </EmailText>
      ))}
      <EmailText>
        Creators are paid once their videos are approved, so the sooner you check them the sooner they are paid.
      </EmailText>
      <EmailButton href={url}>Approve videos</EmailButton>
    </EmailLayout>
  );
}
