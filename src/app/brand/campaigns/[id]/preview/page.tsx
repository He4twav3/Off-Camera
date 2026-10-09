import { redirect } from "next/navigation";

/** How creators see the campaign is on the brand home page now. */
export default async function BrandPreviewRedirect(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  redirect(`/brand?c=${id}`);
}
