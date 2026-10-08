import { PlatformIcon } from "@/components/account/PlatformIcons";
import { money } from "@/lib/fees";
import {
  describePostTerms,
  payFor,
  type PostRowData,
  type PostTerms,
} from "@/lib/post-terms";
import type { PlatformEnum } from "@/lib/database.types";

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-heading text-lg font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

/**
 * Overview extras for a joined campaign: the headline numbers, the contract terms in
 * short and, expandable, in full, and the accounts the posts count on.
 */
export function ContractDetails({
  terms,
  posts,
  startedAt,
  handles,
  now = new Date(),
}: {
  terms: PostTerms;
  posts: PostRowData[];
  startedAt: string;
  handles: { platform: PlatformEnum; handle: string }[];
  now?: Date;
}) {
  const pay = payFor(terms, posts, now);
  const counted = posts.filter((p) => pay.posts.some((x) => x.id === p.id));
  const views = counted.reduce((n, p) => n + p.views, 0);
  const inCycle = pay.counted % terms.cycleSize;
  const cycleEarned = pay.posts
    .filter((p) => p.cycle === pay.cyclesCompleted + 1)
    .reduce((n, p) => n + p.base + p.bonus, 0);

  return (
    <section className="mt-6 flex flex-col gap-4">
      <dl className="grid grid-cols-2 divide-x divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card sm:grid-cols-4">
        <Stat label="Earned" value={money(pay.earned)} />
        <Stat label="Posts" value={String(pay.counted)} />
        <Stat label="Views" value={views.toLocaleString("en-US")} />
        <Stat label="This cycle" value={`${inCycle}/${terms.cycleSize}`} />
      </dl>

      <div className="rounded-xl border border-border/70 bg-card px-5 py-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Contract details
        </h3>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          {[
            ["Started", day(startedAt)],
            ["Counting window", `${terms.windowDays} days per post`],
            ["Posts per cycle", `${terms.cycleSize} posts`],
            ["Current cycle earnings", money(cycleEarned)],
            ["Keep posts public", `${terms.keepPublicDays} days`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        <details className="mt-3 border-t border-border/70 pt-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Read the full pay terms
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {describePostTerms(terms).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      </div>

      {handles.length > 0 && (
        <div className="rounded-xl border border-border/70 bg-card px-5 py-4">
          <h3 className="font-heading text-base font-semibold text-foreground">
            Active accounts
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {handles.map((h) => (
              <li
                key={`${h.platform}-${h.handle}`}
                className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/40 px-3 py-1.5 text-sm text-foreground"
              >
                <PlatformIcon platform={h.platform} className="size-4" />@
                {h.handle}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
