/**
 * How a brand pays, in plain steps. Shown where a brand sets its pay (new campaign) and where it pays (Payments),
 * so nobody finds out at the first payment. Brands pay creators directly; OnCamera never holds the money.
 */
export function HowYouPay() {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 p-4 text-sm">
      <p className="font-semibold text-foreground">How you pay</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
        <li>Creators post, and you approve the videos (or we do).</li>
        <li>Each time a creator reaches the payment point below, you get an email and a payment appears in Payments with the exact amount.</li>
        <li>You pay the creator directly from your own Stripe or Wise account, through their payment link. OnCamera never holds the money.</li>
        <li>Send the full amount in US dollars and cover any fees. Then press &ldquo;Mark as paid&rdquo;, and the creator confirms.</li>
      </ol>
    </div>
  );
}
