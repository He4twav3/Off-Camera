// TEMPORARY. Never committed. The join steps for the Getimg campaign.
import Link from "next/link";
import { CreatorShell } from "../_shell";
import { PageShell } from "@/components/kit/ui";
import { PreviewJoinSteps } from "../_join-steps";
import { GETIMG_TERMS, describePostTerms, postTermsChips } from "@/lib/post-terms";
import { brief } from "../_getimg";

export default function Page() {
  return (
    <CreatorShell>
      <PageShell>
        <div className="mx-auto max-w-xl">
          <Link href="/preview/getimg" className="text-sm text-muted-foreground hover:text-foreground">← Getimg</Link>
          <h1 className="mt-3 font-heading text-2xl font-semibold text-foreground sm:text-3xl">Join Getimg</h1>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="How this campaign pays">
            {postTermsChips(GETIMG_TERMS).map((c, i) => (
              <li key={c} className={`rounded-md border px-3 py-1 text-sm font-semibold ${i === 0 ? "border-primary/30 bg-primary/10 text-primary" : "border-border/70 bg-muted/50 text-foreground"}`}>{c}</li>
            ))}
          </ul>
          <div className="mt-8">
            <PreviewJoinSteps jobId="j-getimg" title="Getimg" brief={brief} payLines={describePostTerms(GETIMG_TERMS)} campaignPath="/preview/getimg?joined=1" />
          </div>
        </div>
      </PageShell>
    </CreatorShell>
  );
}
