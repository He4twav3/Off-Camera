import { redirect } from "next/navigation";

/** Campaigns live on the brand home now. */
export default function BrandCampaignsRedirect() {
  redirect("/brand");
}
