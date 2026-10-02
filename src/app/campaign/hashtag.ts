/**
 * The hashtag creators put on campaign posts, derived from the campaign
 * name: "Tech Product Launch" -> "#TechProductLaunch". The view-counting Zap
 * (v3.0) derives the same tag the same way and matches it case-insensitively,
 * so changing this rule means changing the Zap's Code step too.
 */
export function campaignHashtag(campaign: string): string {
  const words = campaign.match(/[A-Za-z0-9]+/g);
  if (!words) return "";
  return "#" + words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
}
