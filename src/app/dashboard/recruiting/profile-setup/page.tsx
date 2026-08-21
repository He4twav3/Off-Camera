import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { ProfileWizard } from "./ProfileWizard";

export const metadata: Metadata = {
  title: "Set up your profile",
};

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/recruiting/profile-setup");

  // Warm start, not a cold-start form: the wizard's name defaults to the
  // real identity from `profiles` (training-domain, always populated by the
  // handle_new_user trigger) rather than asking someone to retype their own
  // name. The applicants row itself still can't be pre-created — name is
  // the only field here without a NOT NULL sibling (handle/platform/
  // username/date_of_birth) that has no sensible default before the wizard
  // is actually filled in.
  const [{ data: niches }, { data: existing }, session] = await Promise.all([
    supabase
      .from("niches")
      .select("id, label")
      .eq("is_active", true)
      .order("label"),
    supabase.from("applicants").select("*").eq("user_id", user.id).maybeSingle(),
    getSession(),
  ]);

  const { data: handles } = existing
    ? await supabase
        .from("applicant_handles")
        .select("*")
        .eq("applicant_id", existing.id)
        .order("is_primary", { ascending: false })
    : { data: [] };

  return (
    <ProfileWizard
      niches={niches ?? []}
      existing={existing ?? null}
      existingHandles={handles ?? []}
      defaultName={session?.displayName ?? ""}
    />
  );
}
