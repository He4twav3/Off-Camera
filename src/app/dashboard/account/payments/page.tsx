import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { AccountShell, Section } from "@/components/account/AccountShell";
import { loadAccount } from "@/lib/account";
import { PayoutInstructionsForm } from "@/app/dashboard/recruiting/earnings/DirectForms";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const { supabase, applicant, person } = await loadAccount(
    "/dashboard/account/payments",
  );
  if (!applicant) redirect("/dashboard/recruiting/profile-setup");

  const { data } = await supabase
    .from("applicants")
    .select("payout_instructions")
    .eq("id", applicant.id)
    .maybeSingle();

  return (
    <AccountShell
      active="payments"
      person={person}
      title="Payments"
      summary="Where brands send your money."
      icon={CreditCard}
    >
      <Section
        title="Payment details"
        summary="Brands pay you directly. They see this to know where to send your money. We never hold it."
      >
        <PayoutInstructionsForm current={data?.payout_instructions ?? null} />
      </Section>
    </AccountShell>
  );
}
