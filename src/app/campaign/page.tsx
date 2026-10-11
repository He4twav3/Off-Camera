import { redirect } from "next/navigation";

/**
 * The old hashtag sign-up form is gone: creators now join a campaign from their own account. The address stays so a link
 * already handed out (in Discord, for example) lands on the creator sign-up instead of an error. The hashtag helper in
 * this folder is still used to count views for older sign-ups.
 */
export default function OldCampaignSignup() {
  redirect("/signup");
}
