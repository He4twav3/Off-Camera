/**
 * Runs once when a server starts. Puts any new version of a signed-off campaign setup on its live campaign
 * (lib/apply-campaign-presets.ts). It never holds up the start for long, and a failure only logs.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { applyCampaignPresets } = await import("@/lib/apply-campaign-presets");
    await Promise.race([applyCampaignPresets(), new Promise((resolve) => setTimeout(resolve, 8000))]);
  } catch (e) {
    console.error("campaign-presets: failed on start:", e instanceof Error ? e.message : e);
  }
}
