/**
 * The payment emails, already written: to the brand (pay this creator, here is the amount and their
 * link) and to the creator (the brand has been asked to pay you). An admin can edit them before sending.
 * Pure (no server imports) so it can be tested.
 */

export type PayItem = {
  creatorName: string;
  campaign: string;
  amount: number;
  dueAt: string;
  /** The creator's Stripe or Wise link, or what they typed in the older format, or null. */
  payTo: string | null;
};

export type Draft = { to: string; subject: string; body: string };

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: Math.round(n * 100) % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

const SIGN_OFF = "Thanks,\nOnCamera";

/** One email to a brand covering everything it currently owes: each creator, the amount, and their link. */
export function brandEmail(input: { to: string; contactName: string; dashboardUrl: string; items: PayItem[] }): Draft {
  const { items } = input;
  const total = items.reduce((n, i) => n + i.amount, 0);
  const lines = items
    .map(
      (i) =>
        `${i.creatorName} (${i.campaign}): ${usd(i.amount)}, by ${day(i.dueAt)}\n` +
        (i.payTo ? `Pay here: ${i.payTo}` : "Payment link: they haven't added one yet, we'll send it as soon as they do"),
    )
    .join("\n\n");
  const one = items.length === 1;
  return {
    to: input.to,
    subject: one ? `Payment due: ${usd(items[0].amount)} to ${items[0].creatorName}` : `Payments due: ${usd(total)} across ${items.length} creators`,
    body:
      `Hi ${first(input.contactName)},\n\n` +
      (one
        ? `${items[0].creatorName} has finished their work on ${items[0].campaign}. Based on their views, the amount owed is ${usd(items[0].amount)}, due by ${day(items[0].dueAt)}.`
        : `Here is what is due to your creators, ${usd(total)} in total.`) +
      `\n\n${lines}\n\n` +
      `You pay each creator directly through their link. Please enter exactly the amount shown, and cover any transfer fees so they receive all of it. The amounts are in US dollars: if your account is in another currency, paying from a Wise account is usually the cheapest way to convert. ` +
      `Once it is sent, mark it as paid in your dashboard so they can confirm: ${input.dashboardUrl}\n\n${SIGN_OFF}`,
  };
}

/** One email to a creator about one payment: what is owed, and that the brand has been asked to pay. */
export function creatorEmail(input: { to: string; creatorName: string; brandName: string | null; item: PayItem; earningsUrl: string; hasLink: boolean }): Draft {
  const { item } = input;
  return {
    to: input.to,
    subject: `${usd(item.amount)} owed to you for ${item.campaign}`,
    body:
      `Hi ${first(input.creatorName)},\n\n` +
      `Your payment for ${item.campaign} is ready: ${usd(item.amount)}, based on your views. ` +
      `${input.brandName ?? "The brand"} has been asked to pay you directly by ${day(item.dueAt)}.\n\n` +
      (input.hasLink
        ? `They will pay through the payment link you saved on your Payments page.`
        : `We don't have a payment link from you yet. Please add your Stripe or Wise link on your Payments page so they can pay you.`) +
      `\n\nWhen the money arrives, please confirm it in your Earnings page: ${input.earningsUrl}\n\n${SIGN_OFF}`,
  };
}

/** A link that opens the person's own email app with the email filled in. */
export function mailtoHref(d: Draft): string {
  return `mailto:${encodeURIComponent(d.to)}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(d.body)}`;
}
