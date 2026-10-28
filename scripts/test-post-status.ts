import { postStatus } from "../src/lib/post-status";
import { campaignHold } from "../src/lib/campaign-holds";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const post = { state: "pending", rejectReason: null, lastError: null };

t("grey while checking it's yours", postStatus(post, null).tone === "grey");
t("amber while being reviewed", (() => { const s = postStatus(post, { inReview: true, windowClosed: false, daysLeft: 20 }); return s.tone === "amber" && s.label === "Video being reviewed"; })());
t("green once approved, with days left", (() => { const s = postStatus(post, { inReview: false, windowClosed: false, daysLeft: 12 }); return s.tone === "green" && s.detail.includes("12 more days"); })());
t("green and final after the window", postStatus(post, { windowClosed: true, daysLeft: 0 }).detail === "Views are final.");
t("a repost says view pay only", postStatus(post, { windowClosed: false, daysLeft: 3, repost: true }).detail.startsWith("Repost"));
t("red with the reason when not approved", (() => { const s = postStatus({ ...post, state: "rejected", rejectReason: "Denied: not on brief" }, null); return s.tone === "red" && s.detail === "Denied: not on brief"; })());
t("unknown window still reads well", postStatus(post, { windowClosed: false, daysLeft: null }).detail === "Views are being counted.");

t("Getimg is open", campaignHold({ title: "Getimg" }) === null);
t("MePersona is open", campaignHold({ title: "MePersona" }) === null);

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
