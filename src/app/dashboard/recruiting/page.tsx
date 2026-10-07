import { redirect } from "next/navigation";

// There is no separate home screen: Campaigns is where a creator lands. This address
// stays because emails, sign-in and older links still point at it.
export default function RecruitingIndex() {
  redirect("/dashboard/recruiting/jobs");
}
