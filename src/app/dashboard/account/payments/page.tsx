import { redirect } from "next/navigation";

// How creators get paid isn't settled yet, so there is no payment page for now.
export default function PaymentsPage() {
  redirect("/dashboard/recruiting/profile-setup");
}
