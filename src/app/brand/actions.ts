"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND_METHODS } from "@/lib/direct-pay";
import { parsePostTerms, postTermsSchema } from "@/lib/post-terms";
import { parseExampleLinks, parseLines } from "@/lib/campaign-brief";
import { redirect } from "next/navigation";
import { sendBrandMarkedPaidEmail } from "@/lib/email/notifications";
import {
  AVATAR_CONTENT_TYPES,
  avatarPathFromUrl,
  checkAvatarFile,
} from "@/lib/avatar";

export interface BrandPayState {
  error?: string;
  success?: string;
}

const schema = z.object({
  id: z.string().uuid(),
  method: z.enum(BRAND_METHODS, { message: "Pick how you paid." }),
  reference: z.string().trim().max(200).optional(),
});

/**
 * The brand says it has paid a creator. The statement must belong to one of the
 * signed-in brand's own campaigns; the service role is used only after that
 * ownership is proved, because direct_payments is admin-only under RLS.
 */
export async function markBrandPaidAction(
  _prev: BrandPayState,
  formData: FormData,
): Promise<BrandPayState> {
  const parsed = schema.safeParse({
    id: formData.get("id"),
    method: formData.get("method"),
    reference: formData.get("reference") ?? "",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the fields." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  // RLS: a brand can only read its own account row.
  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand || brand.status !== "approved")
    return { error: "Your brand account isn't approved yet." };

  const db = createAdminClient();
  const { data: row } = await db
    .from("direct_payments")
    .select(
      "id, amount, brand_paid_at, creator_confirmed_at, assignments!inner(applicants(name, email), jobs!inner(title, brand_account_id))",
    )
    .eq("id", parsed.data.id)
    .eq("assignments.jobs.brand_account_id", brand.id)
    .maybeSingle();
  if (!row || row.assignments?.jobs?.brand_account_id !== brand.id)
    return { error: "We couldn't find that payment." };
  if (row.brand_paid_at || row.creator_confirmed_at)
    return { success: "Already marked as paid." };

  const { error } = await db
    .from("direct_payments")
    .update({
      brand_paid_at: new Date().toISOString(),
      brand_method: parsed.data.method,
      brand_reference: parsed.data.reference || null,
    })
    .eq("id", row.id)
    .is("brand_paid_at", null);
  if (error) return { error: "Couldn't save that. Please try again." };

  const creator = row.assignments?.applicants;
  if (creator) {
    await sendBrandMarkedPaidEmail({
      to: creator.email,
      name: creator.name,
      jobTitle: row.assignments?.jobs?.title ?? "your campaign",
      amount: Number(row.amount),
      method: parsed.data.method,
    });
  }

  revalidatePath("/brand");
  return { success: "Marked as paid. We've asked the creator to confirm." };
}

export interface BrandLogoState {
  error?: string;
  success?: string;
}

/**
 * A brand sets or removes the logo on one of its own campaigns. The campaign must belong
 * to the signed-in, approved brand; only after that is proved is the service role used
 * (the logos folder is admin-only for direct writes), and it changes the logo and nothing
 * else. What the file really is comes from its bytes, not its name.
 */
export async function setCampaignLogoAction(
  _prev: BrandLogoState,
  formData: FormData,
): Promise<BrandLogoState> {
  const jobId = z.string().uuid().safeParse(formData.get("job_id"));
  if (!jobId.success)
    return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand || brand.status !== "approved")
    return { error: "Your brand account isn't approved yet." };

  const db = createAdminClient();
  const { data: job } = await db
    .from("jobs")
    .select("id, logo_url")
    .eq("id", jobId.data)
    .eq("brand_account_id", brand.id)
    .maybeSingle();
  if (!job) return { error: "That campaign isn't yours." };

  let logoUrl: string | null;
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const checked = checkAvatarFile(file.size, bytes, "logo");
    if (!checked.ok) return { error: checked.error };
    if (checked.type === "gif")
      return { error: "Use a JPG, PNG or WebP logo." };
    const path = `${crypto.randomUUID()}.${checked.type}`;
    const { error: uploadError } = await db.storage
      .from("campaign-logos")
      .upload(path, bytes, {
        contentType: AVATAR_CONTENT_TYPES[checked.type],
        upsert: false,
      });
    if (uploadError)
      return { error: "We couldn't upload that logo. Please try again." };
    logoUrl = db.storage.from("campaign-logos").getPublicUrl(path)
      .data.publicUrl;
  } else if (formData.get("remove") === "on") {
    logoUrl = null;
  } else {
    return { error: "Choose a logo to upload." };
  }

  const { error } = await db
    .from("jobs")
    .update({ logo_url: logoUrl })
    .eq("id", job.id);
  if (error) return { error: "Couldn't save the logo. Please try again." };

  // The logo it replaced is no longer used. Failing to tidy it up is harmless.
  const old = avatarPathFromUrl(job.logo_url, "campaign-logos");
  if (old) await db.storage.from("campaign-logos").remove([old]);

  revalidatePath("/brand");
  revalidatePath("/dashboard/recruiting/jobs");
  revalidatePath("/admin");
  return { success: logoUrl ? "Logo updated." : "Logo removed." };
}

const denySchema = z.object({
  post_id: z.string().uuid(),
  reason: z.string().trim().max(200).optional(),
});

/**
 * A brand turns down one post on its own campaign (it doesn't qualify, or breaks the brief).
 * The post is marked rejected, so it stops counting and the creator sees why. The ownership
 * of the campaign is proved first; the service role is used only after that.
 */
export async function denyPostAction(
  _prev: BrandPayState,
  formData: FormData,
): Promise<BrandPayState> {
  const parsed = denySchema.safeParse({
    post_id: formData.get("post_id"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { error: "Check the fields." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };
  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand || brand.status !== "approved")
    return { error: "Your brand account isn't approved yet." };

  const db = createAdminClient();
  const { data: post } = await db
    .from("assignment_posts")
    .select("id, state, assignments(id, jobs(brand_account_id))")
    .eq("id", parsed.data.post_id)
    .maybeSingle();
  if (!post || post.assignments?.jobs?.brand_account_id !== brand.id)
    return { error: "We couldn't find that post." };
  if (post.state === "rejected") return { success: "Already denied." };

  const reason = parsed.data.reason
    ? `Denied by the brand: ${parsed.data.reason}`
    : "Denied by the brand.";
  const { error } = await db
    .from("assignment_posts")
    .update({ state: "rejected", reject_reason: reason })
    .eq("id", post.id);
  if (error) return { error: "We couldn't save that. Please try again." };

  revalidatePath("/brand", "layout");
  revalidatePath("/dashboard/recruiting", "layout");
  revalidatePath("/admin/statements");
  return { success: "Post denied." };
}

// Shared: the signed-in brand, only if approved.
async function approvedBrand() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  return brand && brand.status === "approved" ? brand : null;
}

/** The brand approves a post, when it has chosen to review its own posts. */
export async function approvePostAsBrandAction(
  _prev: BrandPayState,
  formData: FormData,
): Promise<BrandPayState> {
  const id = z.string().uuid().safeParse(formData.get("post_id"));
  if (!id.success) return { error: "Check the fields." };
  const brand = await approvedBrand();
  if (!brand) return { error: "Your brand account isn't approved yet." };

  const db = createAdminClient();
  const { data: post } = await db
    .from("assignment_posts")
    .select("id, state, assignments(jobs(brand_account_id, post_terms))")
    .eq("id", id.data)
    .maybeSingle();
  const job = post?.assignments?.jobs;
  if (!post || job?.brand_account_id !== brand.id) return { error: "We couldn't find that post." };
  if (parsePostTerms(job.post_terms)?.reviewer !== "brand")
    return { error: "OnCamera reviews the posts on this campaign." };
  if (post.state === "rejected") return { error: "That post was denied." };

  const { error } = await db
    .from("assignment_posts")
    .update({ reviewed_at: new Date().toISOString() } as never)
    .eq("id", post.id);
  if (error) return { error: "We couldn't save that. Is post review switched on yet?" };
  revalidatePath("/brand", "layout");
  revalidatePath("/dashboard/recruiting", "layout");
  revalidatePath("/admin/statements");
  return { success: "Approved." };
}

const reviewerSchema = z.object({
  job_id: z.string().uuid(),
  reviewer: z.enum(["oncamera", "brand"]),
});

/** The brand chooses who reviews each post on a per-post campaign: OnCamera, or the brand. */
export async function setPostReviewerAction(
  _prev: BrandPayState,
  formData: FormData,
): Promise<BrandPayState> {
  const parsed = reviewerSchema.safeParse({
    job_id: formData.get("job_id"),
    reviewer: formData.get("reviewer"),
  });
  if (!parsed.success) return { error: "Check the fields." };
  const brand = await approvedBrand();
  if (!brand) return { error: "Your brand account isn't approved yet." };

  const db = createAdminClient();
  const { data: job } = await db
    .from("jobs")
    .select("id, post_terms")
    .eq("id", parsed.data.job_id)
    .eq("brand_account_id", brand.id)
    .maybeSingle();
  const terms = job ? parsePostTerms(job.post_terms) : null;
  if (!job || !terms) return { error: "We couldn't find that campaign." };

  const { error } = await db
    .from("jobs")
    .update({ post_terms: { ...terms, reviewer: parsed.data.reviewer } })
    .eq("id", job.id);
  if (error) return { error: "We couldn't save that. Please try again." };
  revalidatePath("/brand", "layout");
  revalidatePath("/admin/review");
  return {
    success:
      parsed.data.reviewer === "brand"
        ? "You will review the posts on this campaign."
        : "OnCamera will review the posts on this campaign.",
  };
}

// --- creating and closing campaigns ---------------------------------------------------------

export interface NewCampaignState {
  error?: string;
  /** What was typed, so a mistake doesn't wipe the form. */
  values?: {
    fields: Record<string, string>;
    platforms: string[];
    msViews: string[];
    msAmount: string[];
  };
}

const PLATFORM_CHOICES = ["tiktok", "instagram", "youtube_shorts"] as const;

const newCampaignSchema = z.object({
  title: z.string().trim().min(2, "Give the campaign a name.").max(120),
  niche_id: z.string().uuid("Pick a niche."),
  about: z.string().trim().max(2000, "Keep the brand note under 2,000 characters.").optional(),
  base: z.coerce.number().min(0, "Pay can't be negative.").max(100_000),
  cycle: z.coerce.number().int().min(1, "Videos per payment must be at least 1.").max(200),
  window: z.coerce.number().int().min(1).max(365),
  keep_public: z.coerce.number().int().min(0).max(1000),
  reviewer: z.enum(["oncamera", "brand"]),
});

/**
 * A brand creates and posts a campaign. It goes live straight away on this brand's account
 * (the brand is already approved), paid per video with view bonuses. Written with the service
 * role only after the brand's own approval is proved.
 */
export async function createCampaignAction(
  _prev: NewCampaignState,
  formData: FormData,
): Promise<NewCampaignState> {
  const values: NewCampaignState["values"] = {
    fields: Object.fromEntries(
      [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
    ),
    platforms: formData.getAll("platforms").map(String),
    msViews: formData.getAll("ms_views").map(String),
    msAmount: formData.getAll("ms_amount").map(String),
  };
  const fail = (error: string): NewCampaignState => ({ error, values });

  const brand = await approvedBrand();
  if (!brand) return fail("Your brand account isn't approved yet.");

  const parsed = newCampaignSchema.safeParse({
    title: formData.get("title"),
    niche_id: formData.get("niche_id"),
    about: formData.get("about") ?? "",
    base: formData.get("base"),
    cycle: formData.get("cycle"),
    window: formData.get("window"),
    keep_public: formData.get("keep_public"),
    reviewer: formData.get("reviewer") ?? "oncamera",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the fields.");
  const v = parsed.data;

  const platforms = PLATFORM_CHOICES.filter((p) => formData.getAll("platforms").includes(p));
  if (platforms.length === 0) return fail("Pick at least one platform.");

  const rules = parseLines(String(formData.get("rules") ?? ""), 12, 300);
  if (!rules.ok) return fail(`Rules: ${rules.error}`);
  const formats = parseLines(String(formData.get("formats") ?? ""));
  if (!formats.ok) return fail(`Formats that work: ${formats.error}`);

  // Bonus milestones: pairs of (views, bonus). Empty rows are ignored; each must be complete.
  const views = formData.getAll("ms_views").map((x) => String(x).trim());
  const amounts = formData.getAll("ms_amount").map((x) => String(x).trim());
  const milestones: { views: number; amount: number }[] = [];
  for (let i = 0; i < Math.max(views.length, amounts.length); i++) {
    const a = views[i] ?? "";
    const b = amounts[i] ?? "";
    if (!a && !b) continue;
    const n = Number(a.replace(/,/g, ""));
    const m = Number(b);
    if (!Number.isFinite(n) || !Number.isFinite(m) || n <= 0 || m <= 0)
      return fail("Each bonus needs a number of views and an amount above zero.");
    milestones.push({ views: Math.round(n), amount: m });
  }
  if (new Set(milestones.map((m) => m.views)).size !== milestones.length)
    return fail("Two bonuses have the same number of views.");

  const terms = postTermsSchema.safeParse({
    v: 2,
    basePerPost: v.base,
    cycleSize: v.cycle,
    milestones,
    windowDays: v.window,
    keepPublicDays: v.keep_public,
    platforms,
    repostsEarnBase: false,
    reviewer: v.reviewer,
  });
  if (!terms.success) return fail("Check the pay terms.");

  const db = createAdminClient();
  const { data: job, error } = await db
    .from("jobs")
    .insert({
      title: v.title,
      description: rules.lines.join("\n"),
      platform: platforms[0],
      niche_id: v.niche_id,
      payout_type: "flat",
      payout_amount: v.base,
      payout_notes: "Pays per video, with view bonuses. See the pay terms on this page.",
      account_requirement: "new_ok",
      status: "open",
      brand_account_id: brand.id,
      post_terms: terms.data as unknown as Record<string, unknown>,
      about: v.about || null,
      formats: formats.lines.length ? formats.lines.join("\n") : null,
    })
    .select("id")
    .single();
  if (error || !job) return fail("We couldn't create the campaign. Please try again.");

  revalidatePath("/brand", "layout");
  revalidatePath("/dashboard/recruiting/jobs");
  revalidatePath("/admin");
  redirect(`/brand/campaigns/${job.id}`);
}

const statusSchema = z.object({
  job_id: z.string().uuid(),
  status: z.enum(["open", "closed"]),
});

/** A brand closes its campaign to new creators, or opens it again. */
export async function setCampaignStatusAction(
  _prev: BrandPayState,
  formData: FormData,
): Promise<BrandPayState> {
  const parsed = statusSchema.safeParse({
    job_id: formData.get("job_id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Check the fields." };
  const brand = await approvedBrand();
  if (!brand) return { error: "Your brand account isn't approved yet." };

  const { data, error } = await createAdminClient()
    .from("jobs")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.job_id)
    .eq("brand_account_id", brand.id)
    .select("id");
  if (error || !data || data.length === 0) return { error: "We couldn't find that campaign." };
  revalidatePath("/brand", "layout");
  revalidatePath("/dashboard/recruiting/jobs");
  return { success: parsed.data.status === "open" ? "Campaign reopened." : "Campaign closed to new creators." };
}

// --- business details ---------------------------------------------------------------------

export interface BusinessState {
  error?: string;
  success?: string;
}

/** A brand edits its own business details. brand_accounts has no brand write policy, so the
 * save is made with the service role, only on the signed-in brand's own row. */
export async function saveBusinessDetailsAction(
  _prev: BusinessState,
  formData: FormData,
): Promise<BusinessState> {
  const company = String(formData.get("company_name") ?? "").trim();
  const contact = String(formData.get("contact_name") ?? "").trim();
  let website = String(formData.get("website") ?? "").trim().slice(0, 200);
  if (company.length < 2 || company.length > 120) return { error: "Enter your company name." };
  if (contact.length < 2 || contact.length > 120) return { error: "Enter a contact name." };
  if (website) {
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
    try {
      const url = new URL(website);
      if (!url.hostname.includes(".")) throw new Error("bad");
    } catch {
      return { error: "That website doesn't look right. Use an address like https://yourbrand.com" };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { data, error } = await createAdminClient()
    .from("brand_accounts")
    .update({ company_name: company, contact_name: contact, website: website || null })
    .eq("user_id", user.id)
    .select("id");
  if (error || !data || data.length === 0) return { error: "We couldn't save that. Please try again." };

  revalidatePath("/brand", "layout");
  revalidatePath("/admin/brands");
  return { success: "Saved." };
}

// --- editing a campaign ---------------------------------------------------------------------

export interface EditCampaignState {
  error?: string;
  success?: string;
}

const editSchema = z.object({
  job_id: z.string().uuid(),
  title: z.string().trim().min(2, "Give the campaign a name.").max(120),
  niche_id: z.string().uuid("Pick a niche."),
  about: z.string().trim().max(2000, "Keep the brand note under 2,000 characters.").optional(),
});

/**
 * A brand edits the brief of a campaign it owns: name, niche, brand note, rules, formats and
 * example videos. The pay terms are NOT editable here: changing them would change what is owed
 * on videos already made, so that goes through OnCamera. Saved with the service role only after
 * the brand's ownership of the campaign is proved.
 */
export async function updateCampaignAction(
  _prev: EditCampaignState,
  formData: FormData,
): Promise<EditCampaignState> {
  const parsed = editSchema.safeParse({
    job_id: formData.get("job_id"),
    title: formData.get("title"),
    niche_id: formData.get("niche_id"),
    about: formData.get("about") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields." };
  const rules = parseLines(String(formData.get("rules") ?? ""), 12, 300);
  if (!rules.ok) return { error: `Rules: ${rules.error}` };
  const formats = parseLines(String(formData.get("formats") ?? ""));
  if (!formats.ok) return { error: `Formats that work: ${formats.error}` };
  const examples = parseExampleLinks(String(formData.get("examples") ?? ""));
  if (!examples.ok) return { error: `Example videos: ${examples.error}` };

  const brand = await approvedBrand();
  if (!brand) return { error: "Your brand account isn't approved yet." };

  const { data, error } = await createAdminClient()
    .from("jobs")
    .update({
      title: parsed.data.title,
      niche_id: parsed.data.niche_id,
      about: parsed.data.about || null,
      description: rules.lines.join("\n"),
      formats: formats.lines.length ? formats.lines.join("\n") : null,
      example_urls: examples.urls,
    })
    .eq("id", parsed.data.job_id)
    .eq("brand_account_id", brand.id)
    .select("id");
  if (error || !data || data.length === 0) return { error: "We couldn't save that campaign." };

  revalidatePath("/brand", "layout");
  revalidatePath("/dashboard/recruiting/jobs", "layout");
  revalidatePath("/admin");
  return { success: "Saved. Creators see the changes now." };
}
