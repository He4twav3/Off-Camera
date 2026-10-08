import Link from "next/link";
import { cn } from "@/lib/utils";

export type TrackingTab = "overview" | "earnings" | "posts";
const TABS: { key: TrackingTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "earnings", label: "Earnings" },
  { key: "posts", label: "Posts" },
];

/** Tabs as links (?tab=), so no script is needed and a tab can be linked to. */
export function TrackingTabs({
  active,
  basePath,
}: {
  active: TrackingTab;
  basePath: string;
}) {
  return (
    <nav
      aria-label="Campaign sections"
      className="mt-5 flex gap-1 border-b border-border/70"
    >
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.key === "overview" ? basePath : `${basePath}?tab=${t.key}`}
          aria-current={t.key === active ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            t.key === active
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function parseTab(raw: string | undefined): TrackingTab {
  return raw === "earnings" || raw === "posts" ? raw : "overview";
}
