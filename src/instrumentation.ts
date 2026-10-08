/**
 * Runs once when the server starts. It fixes one piece of data that was saved wrong: the
 * Getimg campaign was created under the first niche alphabetically (Beauty) when it is a
 * Tech campaign. It changes nothing unless Getimg is still on Beauty, so a niche chosen
 * later in Admin is never overwritten, and it does nothing at all once it has run.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
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
