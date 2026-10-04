import { redirect } from "next/navigation";

/**
 * /signup used to be a passwordless "save your spot" capture that emailed a
 * "Sign in & start the course" link. Signup is now one flow — name, email,
 * password and handles, confirmed with an emailed code — at /create-account.
 * Every "Save your spot" button on the site still points here, so this just
 * forwards them rather than leaving a second, competing funnel.
 */
export default function SignupPage() {
  redirect("/create-account");
}
