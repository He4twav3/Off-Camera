import { redirect } from "next/navigation";

/** The campaign lives on the brand home page now. */
export default async function BrandCampaignRedirect(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  redirect(`/brand?c=${id}`);
}
