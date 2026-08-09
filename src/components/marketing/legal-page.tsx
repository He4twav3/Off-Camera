import type { ReactNode } from "react";

/**
 * Shared shell for prose-style legal pages (Terms, Privacy, Refund Policy).
 * No typography plugin installed, so child markup (h2/p/ul) is styled here
 * via descendant selectors instead.
 */
export function LegalPage({
  title,
  lastUpdated,
  intro,
  children,
}: {
  title: string;
  lastUpdated: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {lastUpdated}
      </p>
      {intro && (
        <p className="mt-6 text-muted-foreground">{intro}</p>
      )}
      <div
        className="mt-4 [&_h2]:mt-9 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ol]:text-muted-foreground [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-muted-foreground"
      >
        {children}
      </div>
    </section>
  );
}
