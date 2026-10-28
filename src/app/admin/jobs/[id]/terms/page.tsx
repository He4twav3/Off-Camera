import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { SectionTitle } from "@/components/admin/table";
import { FeeForm } from "../FeeForm";
import { getFeeBands } from "@/lib/campaign-fees";
import { STANDARD_FEE, describeFee } from "@/lib/fee";
import { deleteEmptyJobAction } from "../../actions";

export const metadata: Metadata = { title: "Fee and removal · Admin" };

// One campaign's OnCamera fee, and removing the campaign. The pay itself is set in Edit (JobForm).
export default async function AdminPayTermsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const c = (await getAdminWorkspace()).campaigns.find((x) => x.id === id);
  const fees = await getFeeBands([id]);
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          Campaigns
        </Link>
        {" / "}
        <Link href={`/admin/jobs/${c.id}`} className="hover:text-foreground">
          {c.title}
        </Link>
      </nav>
      <h1 className="mb-5 mt-3 font-heading text-2xl font-semibold text-foreground">Fee and removal</h1>
      <p className="mb-5 text-sm text-muted-foreground">The requirements and the payment are set in Edit on the campaign page.</p>

      <SectionTitle>OnCamera fee</SectionTitle>
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <p className="mb-3 text-sm text-muted-foreground">
          Every campaign uses the standard fee: {describeFee(STANDARD_FEE.bands, STANDARD_FEE.minimum)}. Change it here only for a
          brand that has its own signed agreement with a different fee. Empty the boxes to go back to the standard fee.
          {fees.available ? "" : " Run migration 0026 in Supabase before a different fee can be saved."}
        </p>
        <FeeForm jobId={c.id} fee={fees.terms.get(c.id) ?? STANDARD_FEE} custom={fees.custom.has(c.id)} />
      </div>

      <SectionTitle>Remove campaign</SectionTitle>
      <div className="rounded-xl border border-border/70 bg-card p-5">
        {c.creators.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Creators have joined this campaign, so it can&apos;t be deleted. Set its status to Closed with Edit on the campaign page instead.
          </p>
        ) : (
          <form action={deleteEmptyJobAction} className="flex flex-wrap items-center gap-4">
            <input type="hidden" name="id" value={c.id} />
            <p className="text-sm text-muted-foreground">Nobody has joined, so it can be deleted for good.</p>
            <button type="submit" className="cursor-pointer rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-semibold text-destructive">
              Delete campaign
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
