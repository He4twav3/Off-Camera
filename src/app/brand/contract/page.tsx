import { redirect } from "next/navigation";

/** Brands don't sign a contract in the app (it is agreed with them in writing), so this old link goes home. */
export default function BrandContractRedirect() {
  redirect("/brand");
}
