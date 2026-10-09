import { redirect } from "next/navigation";

/** The ranking is the Creators page now. */
export default function BrandLeaderboardRedirect() {
  redirect("/brand/creators");
}
