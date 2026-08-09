import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Changelog",
  description: `What's new on ${siteConfig.name}.`,
  alternates: { canonical: "/changelog" },
};

const entries = [
  {
    date: "2026-08-09",
    title: "Real lesson progress tracking",
    body: "Your dashboard now tracks the lessons you've actually marked complete, module by module, instead of showing example numbers. A brand new account starts at zero, on purpose.",
  },
  {
    date: "2026-08-09",
    title: "Site-wide search",
    body: "Press ⌘K (or Ctrl+K) anywhere, or use the search bar in the header, to jump straight to any page, module, or lesson.",
  },
  {
    date: "2026-08-07",
    title: "Real account system",
    body: "Signing in now sets a real session: the dashboard is gated behind it, and logging out actually logs you out, from any page.",
  },
  {
    date: "2026-08-07",
    title: "Checkout and downloadable resources",
    body: "Added a real checkout flow, plus the pitch email and contract templates mentioned in the course are now real downloads, not placeholder links.",
  },
  {
    date: "2026-07-28",
    title: "Pricing simplified",
    body: "Moved to a single one-time payment. No tiers, no installment plan to think about.",
  },
  {
    date: "2026-07-20",
    title: "Off Camera launched",
    body: "8 modules, 25 lessons, on how to create faceless content and get picked for brand deals.",
  },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
        Changelog
      </h1>
      <p className="mt-2 text-muted-foreground">
        What&apos;s changed on {siteConfig.name}. Course content updates are
        included with lifetime access; this is what&apos;s shipped so far.
      </p>

      <ol className="mt-10 space-y-8 border-l-2 border-border pl-6">
        {entries.map((entry) => (
          <li key={entry.title} className="relative">
            <span className="absolute top-1.5 -left-[1.6rem] size-3 rounded-full border-2 border-ink bg-primary" />
            <time
              dateTime={entry.date}
              className="text-xs font-medium text-muted-foreground"
            >
              {new Date(entry.date + "T00:00:00Z").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}
            </time>
            <h2 className="mt-1 text-base font-semibold">{entry.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{entry.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
