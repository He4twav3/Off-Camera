import { EmailLayout, EmailHeading, EmailText, EmailButton } from "./components/email-layout";

/** To the creator: a statement exists, the brand has been asked to pay them directly. */
export function StatementIssuedCreatorEmail({
  name,
  jobTitle,
  amountLabel,
  dueLabel,
  paymentsUrl,
}: {
  name: string;
  jobTitle: string;
  amountLabel: string;
  dueLabel: string;
  paymentsUrl: string;
}) {
  return (
    <EmailLayout preview={`${amountLabel} for ${jobTitle}: the brand has been asked to pay you`}>
      <EmailHeading>Your campaign is done, {name}</EmailHeading>
      <EmailText>
        Based on your views, <strong>{amountLabel}</strong> is owed to you for{" "}
        <strong>{jobTitle}</strong>. The brand pays you directly and has been
        asked to do so by <strong>{dueLabel}</strong>.
      </EmailText>
      <EmailText>
        Make sure the brand can pay you: add your Stripe or Wise payment link on
        your Payments page. When the money arrives, confirm it there.
      </EmailText>
      <EmailButton href={paymentsUrl}>Open your payments</EmailButton>
    </EmailLayout>
  );
}

/** To the brand: please pay this creator, here is how. */
export function StatementIssuedBrandEmail({
  contactName,
  jobTitle,
  creatorName,
  amountLabel,
  dueLabel,
  brandUrl,
  payLink,
  payLabel,
}: {
  payLink?: string | null;
  payLabel?: string | null;
  contactName: string;
  jobTitle: string;
  creatorName: string;
  amountLabel: string;
  dueLabel: string;
  brandUrl: string;
}) {
  return (
    <EmailLayout preview={`Payment due: ${amountLabel} to ${creatorName}`}>
      <EmailHeading>A payment is due, {contactName}</EmailHeading>
      <EmailText>
        <strong>{creatorName}</strong> has finished <strong>{jobTitle}</strong>.
        Based on the views, the amount owed is <strong>{amountLabel}</strong>,
        due by <strong>{dueLabel}</strong>.
      </EmailText>
      {payLink ? (
        <>
          <EmailText>
            You pay the creator directly through their own payment page. Open it
            and enter exactly <strong>{amountLabel}</strong>. Then mark it as paid
            in your dashboard so they can confirm.
          </EmailText>
          <EmailButton href={payLink}>{`Pay ${amountLabel} with ${payLabel ?? "their link"}`}</EmailButton>
          <EmailText>
            <a href={brandUrl}>See the statement</a>
          </EmailText>
        </>
      ) : (
        <>
          <EmailText>
            You pay the creator directly. Open your dashboard to see how they
            asked to be paid, and mark it as paid once you have sent it.
          </EmailText>
          <EmailButton href={brandUrl}>See the statement</EmailButton>
        </>
      )}
    </EmailLayout>
  );
}

/** To the creator: the brand says it paid; please confirm (or tell us if not). */
export function BrandMarkedPaidEmail({
  name,
  jobTitle,
  amountLabel,
  methodLabel,
  paymentsUrl,
}: {
  name: string;
  jobTitle: string;
  amountLabel: string;
  methodLabel: string;
  paymentsUrl: string;
}) {
  return (
    <EmailLayout preview={`The brand says it paid you ${amountLabel}. Please confirm`}>
      <EmailHeading>Did you get paid, {name}?</EmailHeading>
      <EmailText>
        The brand says it sent you <strong>{amountLabel}</strong> for{" "}
        <strong>{jobTitle}</strong> ({methodLabel}). Please check your account
        and confirm once the money has arrived. If it hasn&apos;t, tell us there
        and we&apos;ll follow up with the brand.
      </EmailText>
      <EmailButton href={paymentsUrl}>Confirm or report</EmailButton>
    </EmailLayout>
  );
}
