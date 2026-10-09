import { redirect } from "next/navigation";

/** The brand templates are gone: the contract and the New campaign form replace them. */
export default function BrandTemplatesRedirect() {
  redirect("/brand");
}
