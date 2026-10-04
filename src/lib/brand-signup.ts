import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Brand signup: contact name, company, optional website, work email + password
 * and agreement to the terms. Parked on the auth user's `user_metadata`
 * (`account_type: "brand"`) until the emailed code is confirmed, then turned
 * into a `brand_accounts` row — pending until an admin approves it.
 */

export type BrandSignupInput = {
  firstName: string;
  lastName: string;
  companyName: string;
  website: string;
};

export function parseBrandSignup(
  formData: FormData,
): { ok: true; value: BrandSignupInput } | { ok: false; error: string } {
  const firstName = String(formData.get("first_name") ?? "").trim().slice(0, 60);
  const lastName = String(formData.get("last_name") ?? "").trim().slice(0, 60);
  const companyName = String(formData.get("company_name") ?? "").trim().slice(0, 120);
  let website = String(formData.get("website") ?? "").trim().slice(0, 200);

  if (!firstName) return { ok: false, error: "Enter your first name." };
  if (!lastName) return { ok: false, error: "Enter your surname." };
  if (!companyName) return { ok: false, error: "Enter your company name." };

  if (website) {
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
    try {
      const u = new URL(website);
      if (!u.hostname.includes(".")) throw new Error("no tld");
      website = u.toString();
    } catch {
      return { ok: false, error: "Enter a valid website, like yourbrand.com." };
    }
  }
  if (formData.get("terms") !== "on") {
    return { ok: false, error: "Agree to the Terms and Privacy Policy to continue." };
  }
  return { ok: true, value: { firstName, lastName, companyName, website } };
}

export function brandMetadata(input: BrandSignupInput) {
  return {
    account_type: "brand",
    first_name: input.firstName,
    last_name: input.lastName,
    display_name: `${input.firstName} ${input.lastName}`,
    company_name: input.companyName,
    website: input.website,
    tos_accepted_at: new Date().toISOString(),
  };
}

/** Creates the brand's account row from the signup metadata. Idempotent. */
export async function createBrandAccount(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("brand_accounts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return;

  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = (data.user?.user_metadata ?? {}) as Record<string, string | undefined>;
  if (meta.account_type !== "brand" || !meta.company_name) return;

  const { error } = await admin.from("brand_accounts").insert({
    user_id: userId,
    company_name: meta.company_name,
    website: meta.website || null,
    contact_name: `${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim() || meta.company_name,
  });
  if (error) console.error("createBrandAccount failed:", error.message);
}
