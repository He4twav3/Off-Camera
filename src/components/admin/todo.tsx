import Link from "next/link";
import type { Task } from "@/lib/admin-tasks";
import type { ACampaign } from "@/lib/admin-workspace";
import { contractStatus } from "@/lib/contract";

/** Videos the brand approves itself and hasn't yet: nothing for us to do, but worth a nudge. Not counted in the menu. */
export function waitingOnBrand(c: Pick<ACampaign, "terms" | "awaitingReview">): number {
  return c.terms?.reviewer === "brand" ? c.awaitingReview : 0;
}

/**
 * Things that are the brand's to do. Nothing for us to do, but worth a nudge, so they are shown as plain lines and
 * not counted in the menu: videos the brand hasn't approved yet, and a contract it hasn't agreed to.
 */
export function brandNotes(c: Pick<ACampaign, "terms" | "awaitingReview" | "brandId">): string[] {
  const notes: string[] = [];
  const videos = waitingOnBrand(c);
  if (videos > 0) notes.push(`${videos} ${videos === 1 ? "video" : "videos"} waiting on the brand`);
  if (c.terms && c.brandId) {
    const status = contractStatus(c.terms);
    if (status === "none") notes.push("Contract not signed by the brand yet");
    if (status === "changed") notes.push("Pay terms changed: the brand must agree to the contract again");
  }
  return notes;
}

/** What is waiting on a campaign, in plain words, each one a link to where it gets done. Nothing waiting says so. */
export function Todo({ tasks, notes = [] }: { tasks: Task[]; notes?: string[] }) {
  if (tasks.length === 0 && notes.length === 0) return <span className="text-xs text-muted-foreground">All done</span>;
  return (
    <ul className="flex flex-col gap-1">
      {tasks.map((t) => (
        <li key={t.kind}>
          <Link href={t.href} className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline">
            <span className="min-w-5 rounded bg-primary px-1 text-center font-semibold tabular-nums text-primary-foreground">{t.count}</span>
            {t.label.replace(/^\d+ /, "")}
          </Link>
        </li>
      ))}
      {notes.map((n) => (
        <li key={n} className="text-xs text-muted-foreground">
          {n}
        </li>
      ))}
    </ul>
  );
}
