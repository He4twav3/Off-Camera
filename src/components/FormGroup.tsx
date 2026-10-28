import type { ReactNode } from "react";

/** A marked group of form fields, with a sign saying where on the site they show. */
export function FormGroup({ icon, title, note, children }: { icon: ReactNode; title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border/70 p-4 sm:p-5">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
          {icon}
          {title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}
