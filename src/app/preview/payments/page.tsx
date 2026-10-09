// TEMPORARY. Never committed.
import { CreditCard } from "lucide-react";
import { AccountPreview } from "../_account";
import { Section } from "@/components/account/AccountShell";
import { PayoutInstructionsForm } from "@/app/dashboard/recruiting/earnings/DirectForms";

export default function Page() {
  return (
    <AccountPreview active="payments" title="Payments" summary="Where brands send your money." icon={CreditCard}>
      <Section title="Payment details" summary="Brands pay you directly. They see this to know where to send your money. We never hold it.">
        <PayoutInstructionsForm current={null} />
      </Section>
    </AccountPreview>
  );
}
