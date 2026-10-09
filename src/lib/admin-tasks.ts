import type { ACampaign } from "@/lib/admin-workspace";

/**
 * What is waiting on an admin, per campaign. The menu numbers are the sum of these across campaigns, so a
 * number in the menu and the "To do" on a campaign always say the same thing. Each task names the exact
 * job and says where to do it; once it is done it disappears, so nobody does it twice.
 * Pure (no server imports) so it can be tested.
 */
export type Task = {
  kind: "brand" | "review" | "statement" | "chase" | "email";
  count: number;
  label: string;
  href: string;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** `sent` holds "emailed_brand:<id>" and "emailed_creator:<id>" for emails already sent; leave it out to skip the email task. */
export function campaignTasks(c: ACampaign, sent?: Set<string>): Task[] {
  const tasks: Task[] = [];

  if (c.status === "open" && !c.brandId) {
    tasks.push({ kind: "brand", count: 1, label: "No brand attached: attach one when they sign up", href: `/admin/jobs/${c.id}` });
  }

  // Videos only we review (the brand reviews its own).
  if (c.terms?.reviewer === "oncamera" && c.awaitingReview > 0) {
    tasks.push({ kind: "review", count: c.awaitingReview, label: `${plural(c.awaitingReview, "video", "videos")} to approve or deny`, href: "/admin/review" });
  }

  // A statement to issue: something is due that is not on a statement yet.
  const ready = c.creators.filter((cr) =>
    c.perPost ? cr.payable - cr.statemented >= 0.01 : cr.status === "submitted" && cr.statements.length === 0,
  ).length;
  if (ready > 0) {
    tasks.push({ kind: "statement", count: ready, label: `${plural(ready, "statement", "statements")} to issue`, href: "/admin/statements" });
  }

  const statements = c.creators.flatMap((cr) => cr.statements);
  const chase = statements.filter((s) => s.state === "overdue" || s.state === "disputed").length;
  if (chase > 0) {
    tasks.push({ kind: "chase", count: chase, label: `${plural(chase, "payment", "payments")} overdue or disputed`, href: "/admin/statements" });
  }

  if (sent) {
    const open = statements.filter((st) => st.state !== "confirmed");
    const emails = open.filter((st) => !sent.has(`emailed_brand:${st.id}`)).length + open.filter((st) => !sent.has(`emailed_creator:${st.id}`)).length;
    if (emails > 0) {
      tasks.push({ kind: "email", count: emails, label: `${plural(emails, "payment email", "payment emails")} to send`, href: "/admin/payout-details" });
    }
  }

  return tasks;
}
