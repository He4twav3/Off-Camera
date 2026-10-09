// TEMPORARY. Never committed.
import { CreatorShell } from "../_shell";
import { PageShell, PageHeader, EmptyState } from "@/components/kit/ui";
export default function Page() {
  return (<CreatorShell><PageShell><PageHeader title="Course" summary="Optional. Nothing in recruiting waits on it." />
    <EmptyState title="The course lessons live here" body="Unchanged by this redesign, so not drawn in the preview." /></PageShell></CreatorShell>);
}
