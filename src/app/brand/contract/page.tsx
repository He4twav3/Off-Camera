import { redirect } from "next/navigation";

/** The contract pops up on whichever brand page is open until it is signed; there is no separate page. */
export default function BrandContractRedirect() {
  redirect("/brand");
}
