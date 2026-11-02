import Link from "next/link";
import { BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AffiliateProgram } from "@/lib/affiliate-programs";

/**
 * The brand's affiliate program on its campaign page: what the creator gets, for everyone. A creator on the campaign
 * is sent to Affiliates, where their own partner code is; anyone else is told it comes once they're on.
 */
export function AffiliateSection({ program, joined }: { program: AffiliateProgram; joined: boolean }) {
  return (
    <section className="mt-4 rounded-xl border border-border/70 bg-card px-4 py-3 sm:mt-6 sm:px-5 sm:py-4">
      <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
        <BadgePercent className="size-4 text-primary" />
        Your free month and your own link
      </h2>
      <div className="mt-2 flex flex-col gap-1.5 text-[15px] leading-relaxed text-muted-foreground">
        {program.perks.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {joined ? (
        <Button size="sm" className="mt-3" nativeButton={false} render={<Link href="/dashboard/recruiting/affiliates" />}>
          Get your partner code
        </Button>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Your partner code is given to you in Affiliates once you&apos;re on the campaign.</p>
      )}
    </section>
  );
}
