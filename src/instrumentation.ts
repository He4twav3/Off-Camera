/**
 * Runs once when the server starts. It tidies two pieces of data that were saved wrong; each is a
 * no-op once done, and neither overwrites anything an admin chose.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await fixGetimgNiche();
  await removeSampleCampaigns();
}

/**
 * The four sample campaigns the database starts with are not real work. Any that nobody has joined
 * or applied to is deleted, so a real campaign list is never padded with them. One that someone has
 * joined is left alone.
 */
async function removeSampleCampaigns() {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const db = createAdminClient();
    const { data: jobs } = await db
      .from("jobs")
      .select("id")
      .in("title", [
        "Crypto exchange app walkthrough",
        "Fitness app UGC testimonial",
        "Online casino unboxing-style promo",
        "Beauty subscription box review",
      ])
      .is("brand_account_id", null);
    const ids = (jobs ?? []).map((j) => j.id);
    if (ids.length === 0) return;
    const [{ data: joined }, { data: applied }] = await Promise.all([
      db.from("assignments").select("job_id").in("job_id", ids),
      db.from("applications").select("job_id").in("job_id", ids),
    ]);
    const used = new Set([...(joined ?? []), ...(applied ?? [])].map((r) => r.job_id));
    const free = ids.filter((id) => !used.has(id));
    if (free.length > 0) await db.from("jobs").delete().in("id", free);
  } catch (err) {
    console.error("sample campaigns not removed:", (err as Error).message);
  }
}

/**
 * The Getimg campaign was created under the first niche alphabetically (Beauty) when it is a Tech
 * campaign. Changed only while it is still on Beauty.
 */
async function fixGetimgNiche() {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const db = createAdminClient();

    const { data: jobs } = await db
      .from("jobs")
      .select("id, niches(label)")
      .eq("title", "Getimg");
    const wrong = (jobs ?? []).filter((j) => j.niches?.label === "Beauty");
    if (wrong.length === 0) return;

    let { data: tech } = await db
      .from("niches")
      .select("id")
      .eq("slug", "tech")
      .maybeSingle();
    if (!tech) {
      const made = await db
        .from("niches")
        .insert({ slug: "tech", label: "Tech" })
        .select("id")
        .single();
      tech = made.data;
    }
    if (!tech) return;

    await db
      .from("jobs")
      .update({ niche_id: tech.id })
      .in(
        "id",
        wrong.map((j) => j.id),
      );
  } catch (err) {
    console.error("niche fix skipped:", (err as Error).message);
  }
}
