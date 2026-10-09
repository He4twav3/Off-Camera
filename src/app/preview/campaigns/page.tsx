// TEMPORARY. Never committed. The Campaigns page as it really is: only the Getimg campaign exists.
import { CreatorShell } from "../_shell";
import { PageShell, PageHeader } from "@/components/kit/ui";
import { JobCard } from "@/components/JobCard";
import { GETIMG_TERMS } from "@/lib/post-terms";
import { getimgJob } from "../_getimg";

export default function Page() {
  const job = { ...(getimgJob as object), post_terms: GETIMG_TERMS } as never;
  return (
    <CreatorShell>
      <PageShell>
        <PageHeader title="Campaigns" summary="Pick a campaign and join it." />
        <p className="mb-4 text-sm text-muted-foreground">1 campaign</p>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <JobCard job={job} href="/preview/getimg" />
          </li>
        </ul>
      </PageShell>
    </CreatorShell>
  );
}
