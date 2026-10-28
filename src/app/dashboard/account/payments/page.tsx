import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { AccountShell, Section } from "@/components/account/AccountShell";
import { loadAccount } from "@/lib/account";
import { BankDetailsForm } from "@/app/dashboard/recruiting/earnings/DirectForms";
import { readMaskedDetails } from "@/lib/payout-details-store";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const { applicant, person } = await loadAccount(
    "/dashboard/account/payments",
  );
  if (!applicant) redirect("/dashboard/recruiting/profile-setup");

  const saved = await readMaskedDetails(applicant.id);

  return (
    <AccountShell
      active="payments"
      person={person}
      title="Payments"
      summary="Where brands send your money."
      icon={CreditCard}
    >
      <Section
        title="Bank details"
        summary="Brands pay you through Wise, straight into this account. We never hold your money. Your full details only go into the Wise payment of a brand that owes you."
      >
        <BankDetailsForm saved={saved} />
      </Section>
    </AccountShell>
  );
}
