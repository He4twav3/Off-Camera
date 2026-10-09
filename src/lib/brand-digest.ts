/**
 * The daily note to a brand that approves its own videos: how many are waiting, per campaign, and where to go.
 * Pure (no server imports) so it can be tested.
 */
export type DigestItem = { campaign: string; count: number };

export function digest(input: { contactName: string; items: DigestItem[]; url: string }): { subject: string; text: string } | null {
  const items = input.items.filter((i) => i.count > 0);
  if (items.length === 0) return null;
  const total = items.reduce((n, i) => n + i.count, 0);
  const videos = (n: number) => `${n} ${n === 1 ? "video is" : "videos are"}`;
  const subject = `${total} ${total === 1 ? "video is" : "videos are"} waiting for your approval`;
  const name = input.contactName.trim().split(/\s+/)[0] || "there";
  const lines = items.map((i) => `- ${i.campaign}: ${videos(i.count)} waiting`);
  const text =
    `Hi ${name},\n\n${lines.join("\n")}\n\n` +
    `Creators are paid once their videos are approved, so the sooner you check them the sooner they are paid. ` +
    `Approve or deny them here: ${input.url}\n\nThanks,\nOnCamera`;
  return { subject, text };
}
