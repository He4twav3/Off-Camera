/**
 * Campaigns that still show to creators but take no new applications, with the reason shown in place of the Apply
 * button. Creators already on one keep working on it. Matched on the title, so a duplicate is held too. Remove an
 * entry to open the campaign again.
 */
const HOLDS: { match: (title: string) => boolean; label: string; note: string }[] = [
  {
    match: (title) => title.trim().toLowerCase().startsWith("getimg"),
    label: "Out of budget",
    note: "This campaign is out of budget for now, so it isn't taking new creators.",
  },
];

export function campaignHold(job: { title: string }): { label: string; note: string } | null {
  const hold = HOLDS.find((h) => h.match(job.title));
  return hold ? { label: hold.label, note: hold.note } : null;
}
