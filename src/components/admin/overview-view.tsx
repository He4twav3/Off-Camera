import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminNavGroup } from "@/lib/admin-nav";

export type QueueItem = {
  label: string;
  value: string;
  href: string;
  /** Something is waiting on you: shown in the accent colour. */
  urgent: boolean;
};

/**
 * The admin home: what needs a decision now, then every admin section.
 * Pure display. The numbers are worked out in app/admin/page.tsx.
 */
export function OverviewView({
  summary,
  queue,
  groups,
}: {
  summary: string;
  queue: QueueItem[];
  groups: AdminNavGroup[];
}) {
  const sections = groups.flatMap((g) => g.items).filter((i) => i.href !== "/admin");
  const waiting = queue.filter((q) => q.urgent).length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Overview</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">{summary}</p>
      </header>

      <section aria-labelledby="needs-you">
        <h2 id="needs-you" className="mb-4 font-heading text-xl font-semibold text-foreground">
          {waiting > 0 ? "Needs you" : "Nothing waiting on you"}
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queue.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="block h-full">
                <Card className="h-full border-border/70 transition-colors hover:bg-muted/40">
                  <CardContent>
                    <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
                    <p
                      className={
                        "mt-2 font-heading text-4xl font-semibold tabular-nums " +
                        (item.urgent ? "text-primary" : "text-muted-foreground")
                      }
                    >
                      {item.value}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="everything">
        <h2 id="everything" className="mb-4 font-heading text-xl font-semibold text-foreground">
          Everything in admin
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="block h-full">
                <Card className="h-full border-border/70 transition-colors hover:bg-muted/40">
                  <CardContent>
                    <h3 className="font-heading text-lg font-semibold text-foreground">{s.label}</h3>
                    <p className="mt-1 text-[15px] text-muted-foreground">{s.blurb}</p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
