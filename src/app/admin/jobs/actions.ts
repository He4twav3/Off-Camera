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
import { payoutTermsSchema } from "@/lib/payout-terms";
import { parseExampleLinks, parseLines } from "@/lib/campaign-brief";
import { MAX_GUIDE_LENGTH } from "@/lib/campaign-guide";
import { writeCampaignGuide } from "@/lib/campaign-guide-store";
import { CAMPAIGN_PRESETS, presetRow } from "@/lib/campaign-presets";
import { markPresetDone } from "@/lib/apply-campaign-presets";

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
  payout_type: z.enum(["flat", "cpm", "retainer"]),
  payout_amount: z.coerce.number().min(0, "Payout can't be negative."),
  payout_notes: z.string().trim().max(500).optional(),
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

/** Reads the payout-formula fields of the job form. Returns null terms when none
 * of the parts are filled in (the campaign then uses the plain payout fields). */
function readPayoutTerms(formData: FormData): {
  terms: Record<string, unknown> | null;
  error?: string;
} {
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string): number | null | "bad" => {
    const t = text(k);
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : "bad";
  };
  const read = (k: string, label: string) => {
    const n = num(k);
    if (n === "bad") throw new Error(`${label} must be a number.`);
    return n;
  };

  try {
    const fixed = read("fixed_per_video", "Fixed fee") ?? 0;
    const videos = read("videos", "Videos") ?? 1;
    const cpmRate = read("cpm_rate", "Rate per 1,000 views");
    const cpmStart = read("cpm_starts_at", "Views before the rate starts") ?? 0;
    const cap = read("cap_per_creator", "Maximum payout");
    const days = read("measure_days", "Measurement days") ?? 30;

    const bonuses: { views: number; amount: number }[] = [];
    for (const i of [1, 2, 3]) {
      const views = read(`bonus${i}_views`, `Bonus ${i} views`);
      const amount = read(`bonus${i}_amount`, `Bonus ${i} amount`);
      if (views === null && amount === null) continue;
      if (views === null || amount === null)
        throw new Error(
          `Fill in both the views and the amount for bonus ${i}, or leave both empty.`,
        );
      bonuses.push({ views, amount });
    }

    const any =
      fixed > 0 || (cpmRate !== null && cpmRate > 0) || bonuses.length > 0;
    if (!any) return { terms: null };

    const parsed = payoutTermsSchema.safeParse({
      v: 1,
      videos,
      fixedPerVideo: fixed,
      cpm:
        cpmRate !== null && cpmRate > 0
          ? {
              ratePer1000: cpmRate,
              startsAt: Math.max(0, Math.floor(cpmStart)),
            }
          : null,
      bonuses,
      capPerCreator: cap !== null && cap > 0 ? cap : null,
      measureDays: days,
      fixedPaidOn: text("fixed_paid_on") === "end" ? "end" : "approval",
    });
    if (!parsed.success)
      return {
        terms: null,
        error: parsed.error.issues[0]?.message ?? "Check the payout formula.",
      };
    return { terms: parsed.data };
  } catch (e) {
    return { terms: null, error: (e as Error).message };
  }
}

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
    platform: formData.get("platform"),
    niche_id: nicheId,
    payout_type: formData.get("payout_type"),
    payout_amount: formData.get("payout_amount"),
    payout_notes: formData.get("payout_notes") ?? "",
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

  const formula = readPayoutTerms(formData);
  if (formula.error) return { error: formula.error };

  const supabase = await createClient();
  const { id, ...values } = parsed.data;

  const row = {
    ...values,
    description: values.description ?? "",
    payout_notes: values.payout_notes || null,
    notion_sop_url: values.notion_sop_url || null,
    brand_account_id: values.brand_account_id || null,
    payout_terms: formula.terms,
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

  // Edited by hand: the campaign's signed-off setup must not put its own version back over these changes.
  await markPresetDone(savedRow.id);

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

// --- the contract's pay terms ---------------------------------------------------------------

export interface PayTermsState {
  error?: string;
  success?: string;
}

/**
 * Edit a campaign's per-video pay terms: pay per video, videos per payment, bonuses, counting window,
 * platforms, whether reposts earn the base, and who reviews posts. It changes what is owed on videos
 * already made, so the page says so. Runs as the signed-in admin (RLS), not the service role.
 */
export async function updatePayTermsAction(_prev: PayTermsState, formData: FormData): Promise<PayTermsState> {
  const jobId = z.string().uuid().safeParse(formData.get("job_id"));
  if (!jobId.success) return { error: "Check the fields." };
  const pay = parsePayTermsFields((k) => String(formData.get(k) ?? ""), (k) => formData.getAll(k).map(String));
  if (!pay.ok) return { error: pay.error };

  const supabase = await createClient();
  // What is already saved: kept when this form does not change it (the signed contract, the repost rule, the fixed bonuses).
  const { data: before } = await supabase.from("jobs").select("post_terms").eq("id", jobId.data).maybeSingle();
  const keptTerms = parsePostTerms(before?.post_terms);

  const reviewer = formData.get("reviewer") === "brand" ? "brand" : "oncamera";
  const requirements = parseRequirements((k) => String(formData.get(k) ?? ""));
  if (!requirements.ok) return { error: requirements.error };
  const terms = postTermsSchema.safeParse({
    ...mergePayTerms({ milestones: keptTerms?.milestones ?? [], cpm: keptTerms?.cpm, statementEvery: keptTerms?.statementEvery, dueDays: keptTerms?.dueDays }, pay.value),
    v: 2,
    repostsEarnBase: keptTerms?.repostsEarnBase ?? false,
    reviewer,
    requirements: requirements.value,
  });
  if (!terms.success)
    return { error: terms.error.issues[0]?.message === "Required" ? "Fill in every pay field." : "Check the pay terms: every number must be valid." };

  // Saving pay terms must not wipe a contract the brand has already agreed to.
  const kept = keptTerms?.contract;
  const { data, error } = await supabase
    .from("jobs")
    .update({ post_terms: { ...terms.data, ...(kept ? { contract: kept } : {}), ...(keptTerms?.preset ? { preset: keptTerms.preset } : {}) } as unknown as Record<string, unknown>, payout_amount: terms.data.basePerPost })
    .eq("id", jobId.data)
    .select("id");
  if (error || !data || data.length === 0) return { error: "Couldn't save the pay terms." };

  revalidatePath(`/admin/jobs/${jobId.data}`, "layout");
  revalidatePath("/admin");
  revalidatePath("/dashboard/recruiting", "layout");
  revalidatePath("/brand", "layout");
  return { success: "Pay terms saved. Every creator's figures now use them." };
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

// --- a signed-off setup, written into the code ------------------------------------------------

export type ApplyPresetState = { error?: string; success?: string };

/**
 * Replaces a campaign's whole setup with a signed-off one from lib/campaign-presets.ts: the brief, the brand note, the
 * example videos, the product guide, the scripts and the pay terms. "Formats that work" is cleared (the formats are in
 * the scripts). Who reviews posts and the brand's signed contract are kept. Runs as the signed-in admin (RLS).
 */
export async function applyCampaignPresetAction(_prev: ApplyPresetState, formData: FormData): Promise<ApplyPresetState> {
  const jobId = z.string().uuid().safeParse(formData.get("job_id"));
  const preset = CAMPAIGN_PRESETS.find((p) => p.key === formData.get("preset"));
  if (!jobId.success || !preset) return { error: "Something's missing. Reload the page and try again." };

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { error: "Only admins can do this." };

  const { data: job } = await supabase.from("jobs").select("post_terms").eq("id", jobId.data).maybeSingle();
  if (!job) return { error: "That campaign wasn't found." };
  const row = presetRow(preset, parsePostTerms(job.post_terms));
  const terms = postTermsSchema.safeParse(row.post_terms);
  if (!terms.success) return { error: "The setup's pay terms aren't valid." };

  const { data: saved, error } = await supabase
    .from("jobs")
    .update({ ...row, post_terms: terms.data as unknown as Record<string, unknown> })
    .eq("id", jobId.data)
    .select("id")
    .maybeSingle();
  if (error || !saved) return { error: "Couldn't save the campaign. Please try again." };

  const written = await writeCampaignGuide(jobId.data, { guide: preset.guide, scripts: preset.scripts });
  if (!written.ok) return { error: `The campaign was saved, but not the guide and scripts. ${written.error}` };

  revalidatePath("/admin");
  revalidatePath(`/admin/jobs/${jobId.data}`);
  revalidatePath("/dashboard/recruiting/jobs");
  revalidatePath("/brand");
  return { success: `Done: the ${preset.label} setup is now on this campaign.` };
}
