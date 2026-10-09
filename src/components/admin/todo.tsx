import Link from "next/link";
import type { Task } from "@/lib/admin-tasks";
import type { ACampaign } from "@/lib/admin-workspace";

/** Videos the brand approves itself and hasn't yet: nothing for us to do, but worth a nudge. Not counted in the menu. */
export function waitingOnBrand(c: Pick<ACampaign, "terms" | "awaitingReview">): number {
  return c.terms?.reviewer === "brand" ? c.awaitingReview : 0;
}

/** What is waiting on a campaign, in plain words, each one a link to where it gets done. Nothing waiting says so. */
export function Todo({ tasks, waiting = 0 }: { tasks: Task[]; waiting?: number }) {
  if (tasks.length === 0 && waiting === 0) return <span className="text-xs text-muted-foreground">All done</span>;
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
      {waiting > 0 && (
        <li className="text-xs text-muted-foreground">
          {waiting} {waiting === 1 ? "video" : "videos"} waiting on the brand
        </li>
      )}
    </ul>
  );
}
