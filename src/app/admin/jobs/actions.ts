"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parsePostTerms, postTermsSchema } from "@/lib/post-terms";
import { parseRequirements } from "@/lib/requirements";
import { mergePayTerms, parsePayTermsFields } from "@/lib/pay-terms-form";
import { parseFeeRows } from "@/lib/fee";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_CONTENT_TYPES,
  avatarPathFromUrl,
  checkAvatarFile,
} from "@/lib/avatar";
import { parseExampleLinks, parseLines } from "@/lib/campaign-brief";
import { MAX_GUIDE_LENGTH } from "@/lib/campaign-guide";
import { writeCampaignGuide } from "@/lib/campaign-guide-store";

export interface JobFormState {
  error?: string;
  success?: string;
}

const jobSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Give the job a title.").max(200),
  description: z.string().trim().max(5000).optional(),
  platform: z.enum(["tiktok", "instagram", "youtube_shorts", "x"]),
  niche_id: z.string().uuid("Pick a niche."),
  account_requirement: z.enum(["new_ok", "established_required"]),
  status: z.enum(["open", "filled", "closed"]),
  brand_account_id: z.string().uuid().optional().or(z.literal("")),
  sample_criteria: z.string().trim().max(1000).optional(),
  about: z
    .string()
    .trim()
    .max(2000, "Keep the brand note under 2,000 characters.")
    .optional(),
  // Optional affiliate link from the brand (most make theirs in Dub). Any https
  // link, so Dub's own domains and brands' custom domains both work.
  affiliate_url: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === "" || /^https:\/\/[^\s]+$/i.test(v),
      "Affiliate link must be a full URL starting with https://",
    )
    .optional(),
  notion_sop_url: z
    .string()
    .trim()
    .url("Enter a full URL, starting with https://")
    .optional()
    .or(z.literal("")),
});

export async function saveJobAction(
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  // A new niche typed into the form is created (or found, if it already exists) and used
  // instead of the one picked in the list. Admins only: the database enforces that.
  let nicheId = formData.get("niche_id");
  const newNiche = String(formData.get("new_niche") ?? "").trim().slice(0, 40);
  if (newNiche) {
    const slug = newNiche
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug) return { error: "Give the niche a name with letters or numbers." };
    const nicheDb = await createClient();
    const { data: found } = await nicheDb
      .from("niches")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (found) {
      nicheId = found.id;
    } else {
      const { data: made, error: nicheError } = await nicheDb
        .from("niches")
        .insert({ slug, label: newNiche })
        .select("id")
        .single();
      if (nicheError || !made)
        return { error: "We couldn't add that niche. Please try again." };
      nicheId = made.id;
    }
  }

  const parsed = jobSchema.safeParse({
    id: (formData.get("id") as string) || "",
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    // The campaign's main platform: the first one in its requirements.
    platform: formData.getAll("platforms").map(String)[0] ?? "tiktok",
    niche_id: nicheId,
    account_requirement: formData.get("account_requirement"),
    status: formData.get("status"),
    brand_account_id: (formData.get("brand_account_id") as string) || "",
    notion_sop_url: formData.get("notion_sop_url") ?? "",
    about: formData.get("about") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the job fields.",
    };
  }

  // What the brand says on the campaign page: formats that work, and example videos.
  const formatLines = parseLines(String(formData.get("formats") ?? ""));
  if (!formatLines.ok)
    return { error: `Formats that work: ${formatLines.error}` };
  const examples = parseExampleLinks(
    String(formData.get("example_urls") ?? ""),
  );
  if (!examples.ok) return { error: `Example videos: ${examples.error}` };

  // The long parts of the brief: the product guide and the scripts (kept in storage, see lib/campaign-guide-store.ts).
  const guide = {
    guide: String(formData.get("guide") ?? ""),
    scripts: String(formData.get("scripts") ?? ""),
  };
  if (guide.guide.length > MAX_GUIDE_LENGTH || guide.scripts.length > MAX_GUIDE_LENGTH)
    return { error: `Keep the product guide and the scripts under ${MAX_GUIDE_LENGTH.toLocaleString("en-US")} characters each.` };

  const supabase = await createClient();
  const { id, ...values } = parsed.data;

  // The one pay setup, with the requirements and who reviews posts. What it doesn't cover (a signed contract, the
  // setup's fingerprints, the repost rule, fixed bonuses) is kept from what is saved.
  const payFields = parsePayTermsFields((k) => String(formData.get(k) ?? ""), (k) => formData.getAll(k).map(String));
  if (!payFields.ok) return { error: payFields.error };
  const requirements = parseRequirements((k) => String(formData.get(k) ?? ""));
  if (!requirements.ok) return { error: requirements.error };
  const { data: before } = id ? await supabase.from("jobs").select("post_terms").eq("id", id).maybeSingle() : { data: null };
  const keptTerms = parsePostTerms(before?.post_terms);
  const terms = postTermsSchema.safeParse({
    ...(keptTerms ?? {}),
    ...mergePayTerms({ milestones: keptTerms?.milestones ?? [], cpm: keptTerms?.cpm, statementEvery: keptTerms?.statementEvery, dueDays: keptTerms?.dueDays }, payFields.value),
    v: 2,
    repostsEarnBase: keptTerms?.repostsEarnBase ?? false,
    reviewer: formData.get("reviewer") === "brand" ? "brand" : "oncamera",
    requirements: requirements.value,
  });
  if (!terms.success)
    return { error: terms.error.issues[0]?.message === "Required" ? "Fill in every payment field." : "Check the payment: every number must be valid." };

  const row = {
    ...values,
    description: values.description ?? "",
    post_terms: terms.data as unknown as Record<string, unknown>,
    payout_type: "flat" as const,
    payout_amount: terms.data.basePerPost,
    payout_notes: terms.data.cpm?.length ? "Pays per video, plus a CPM on views. See the pay terms on this page." : "Pays per video, with view bonuses. See the pay terms on this page.",
    notion_sop_url: values.notion_sop_url || null,
    brand_account_id: values.brand_account_id || null,
    // Off unless the box is ticked: most campaigns are a normal application.
    sample_required: formData.get("sample_required") === "on",
    sample_criteria: values.sample_criteria || null,
    affiliate_url: values.affiliate_url || null,
    about: values.about || null,
    formats: formatLines.lines.length ? formatLines.lines.join("\n") : null,
    example_urls: examples.urls,
  };

  // The campaign's logo. Uploaded as the signed-in admin: the storage rules only let an
  // admin (after two-step sign-in) write to the logos folder. What the file really is
  // comes from its bytes, not its name.
  let logoUrl: string | null | undefined; // undefined = leave as it is
  let oldLogoPath: string | null = null;
  if (id) {
    const { data: current } = await supabase
      .from("jobs")
      .select("logo_url")
      .eq("id", id)
      .maybeSingle();
    oldLogoPath = avatarPathFromUrl(
      current?.logo_url ?? null,
      "campaign-logos",
    );
  }
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const checked = checkAvatarFile(file.size, bytes, "logo");
    if (!checked.ok) return { error: checked.error };
    if (checked.type === "gif")
      return { error: "Use a JPG, PNG or WebP logo." };
    const path = `${crypto.randomUUID()}.${checked.type}`;
    const { error: uploadError } = await supabase.storage
      .from("campaign-logos")
      .upload(path, bytes, {
        contentType: AVATAR_CONTENT_TYPES[checked.type],
        upsert: false,
      });
    if (uploadError)
      return { error: "We couldn't upload that logo. Please try again." };
    logoUrl = supabase.storage.from("campaign-logos").getPublicUrl(path)
      .data.publicUrl;
  } else if (formData.get("remove_logo") === "on") {
    logoUrl = null;
  }

  // RLS restricts writes to admins; this runs as the signed-in admin, not
  // service-role, so the policy is doing the real enforcement.
  const saved: typeof row & { logo_url?: string | null } =
    logoUrl === undefined ? row : { ...row, logo_url: logoUrl };
  const { data: savedRow, error } = id
    ? await supabase.from("jobs").update(saved).eq("id", id).select("id").maybeSingle()
    : await supabase.from("jobs").insert(saved).select("id").maybeSingle();

  if (error || !savedRow) {
    return { error: "Couldn't save the job. Please try again." };
  }

  // Storage is written with the service role, so check here what the database's rules already checked for the row.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin) {
    const written = await writeCampaignGuide(savedRow.id, guide);
    if (!written.ok) return { error: `The campaign was saved, but not the guide and scripts. ${written.error}` };
  }

  // The logo it replaced is no longer used. Failing to tidy it up is harmless.
  if (oldLogoPath && logoUrl !== undefined)
    await supabase.storage.from("campaign-logos").remove([oldLogoPath]);

  revalidatePath("/admin");
  revalidatePath("/dashboard/recruiting/jobs");
  revalidatePath("/brand");
  return { success: id ? "Job updated." : "Job created." };
}

export async function deleteJobAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("jobs").delete().eq("id", id);

  revalidatePath("/admin");
  revalidatePath("/dashboard/recruiting/jobs");
}

// --- the fee, and removing a campaign ---------------------------------------------------------

export interface PayTermsState {
  error?: string;
  success?: string;
}

/** Delete a campaign. Only when nobody has joined it: otherwise there is work and money tied to it. */
export async function deleteEmptyJobAction(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  const { count } = await supabase.from("assignments").select("*", { count: "exact", head: true }).eq("job_id", id.data);
  if ((count ?? 0) > 0) return;
  await supabase.from("jobs").delete().eq("id", id.data);
  revalidatePath("/admin");
  revalidatePath("/dashboard/recruiting/jobs");
  redirect("/admin");
}

/**
 * Set OnCamera's fee for a campaign: a percentage on top of creator pay, in bands. Admin only (the table's policy), and
 * kept apart from the pay terms because brands and creators can read those. Until migration 0026 is run it says so.
 */
export async function saveFeeAction(_prev: PayTermsState, formData: FormData): Promise<PayTermsState> {
  const jobId = z.string().uuid().safeParse(formData.get("job_id"));
  if (!jobId.success) return { error: "Check the fields." };
  const parsed = parseFeeRows((k) => formData.getAll(k).map(String));
  if (!parsed.ok) return { error: parsed.error };
  const rawMin = String(formData.get("fee_min") ?? "").replace(/,/g, "").trim();
  const minimum = rawMin ? Number(rawMin) : 0;
  if (!Number.isFinite(minimum) || minimum < 0) return { error: "The minimum must be an amount, 0 or more." };

  const supabase = (await createClient()) as unknown as {
    from: (n: string) => {
      upsert: (v: object, o: object) => Promise<{ error: { message: string } | null }>;
      delete: () => { eq: (k: string, v: string) => Promise<{ error: { message: string } | null }> };
    };
  };
  const table = supabase.from("campaign_fees");
  const { error } = parsed.bands.length || minimum > 0
    ? await table.upsert({ job_id: jobId.data, bands: { bands: parsed.bands, minimum }, updated_at: new Date().toISOString() }, { onConflict: "job_id" })
    : await table.delete().eq("job_id", jobId.data);
  if (error) return { error: "Couldn't save the fee. If this is the first time, run migration 0026 (campaign fees) in Supabase." };

  revalidatePath(`/admin/jobs/${jobId.data}`, "layout");
  revalidatePath("/admin/statements");
  return { success: parsed.bands.length || minimum > 0 ? "Fee saved. New statements are filled in from it." : "Fee cleared." };
}

