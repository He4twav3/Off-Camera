import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Completeness } from "@/lib/profile-completeness";

/**
 * Shows how complete a profile is and names the single highest-value gap.
 * A percentage alone just nags; a percentage plus "add a link to your best
 * work" gives someone something to actually do.
 *
 * Ported from CreatorRoster's Card/Button/token set onto On Camera's own
 * (see the merge plan's Phase 4) — no `--success` token exists here, so
 * "looking strong" uses `--toy-soft`, the same soft-positive surface the
 * dashboard's own unlock card uses elsewhere.
 */
export function ProfileStrength({ completeness }: { completeness: Completeness }) {
  const { percent, missing, complete } = completeness;

  const tone =
    percent >= 80
      ? { bar: "bg-toy-soft", text: "text-toy-soft-foreground", label: "Looking strong" }
      : percent >= 50
        ? { bar: "bg-accent", text: "text-accent-foreground", label: "Getting there" }
        : { bar: "bg-primary", text: "text-primary", label: "Needs work" };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Profile strength
          </h2>
          <p className={`font-heading text-sm font-semibold tabular-nums ${tone.text}`}>
            {percent}% · {complete ? "Complete" : tone.label}
          </p>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completeness"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${tone.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {complete ? (
          <p className="text-[15px] text-muted-foreground">
            Nothing missing. This is what brands see when you apply.
          </p>
        ) : (
          <>
            <div>
              <p className="text-[15px] text-muted-foreground">
                Add next, in order of what helps most:
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {missing.slice(0, 3).map((m) => (
                  <li
                    key={m.label}
                    className="flex items-start gap-2 text-[15px] text-foreground"
                  >
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {m.label}
                  </li>
                ))}
              </ul>
              {missing.length > 3 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  …and {missing.length - 3} more.
                </p>
              )}
            </div>
            <Button
              size="sm"
              className="self-start"
              nativeButton={false}
              render={<Link href="/profile-setup" />}
            >
              Finish my profile
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
