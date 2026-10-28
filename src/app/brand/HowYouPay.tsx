/**
 * How a brand pays, in plain steps. Shown where a brand sets its pay (new campaign) and where it pays (Payments),
 * so nobody finds out at the first payment. Brands pay creators through their own Wise Business account in one
 * batch; OnCamera never holds the money or needs access to the brand's Wise.
 */
export function HowYouPay() {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-[13px] sm:p-4 sm:text-sm">
      <p className="font-semibold text-foreground">How you pay</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
        <li>Creators post, and you approve the videos (or we do). We track every view and keep a running total.</li>
        <li>At each payout you get the statement here: every creator&apos;s videos, views, bonuses and the total owed, in US dollars.</li>
        <li>Download the Wise payment file below. It has each creator&apos;s name, bank details, currency and amount.</li>
        <li>In your Wise Business account, go to Payments, then Batch, upload the file and pay it from your USD balance. One payment covers every creator, and Wise converts to their currency.</li>
        <li>Press &ldquo;I&apos;ve paid it&rdquo; and add the Wise confirmation. We tell the creators, and each one confirms when the money arrives.</li>
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        Top up your Wise USD balance by ACH a few days before, since it can take 1 to 3 business days to arrive. Creators don&apos;t need a Wise account. We never need access to yours.
      </p>
    </div>
  );
}
