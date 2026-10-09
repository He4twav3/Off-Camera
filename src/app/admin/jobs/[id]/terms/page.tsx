import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { SectionTitle } from "@/components/admin/table";
import { PayTermsForm } from "../PayTermsForm";
import { FeeForm } from "../FeeForm";
import { getFeeBands } from "@/lib/campaign-fees";
import { deleteEmptyJobAction } from "../../actions";

export const metadata: Metadata = { title: "Pay terms · Admin" };

// The contract's pay terms for one campaign, and removing the campaign. Its own page: the campaign page stays about the creators.
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
      <h1 className="mb-5 mt-3 font-heading text-2xl font-semibold text-foreground">Requirements and pay terms</h1>

      <div className="rounded-xl border border-border/70 bg-card p-5">
        <PayTermsForm jobId={c.id} terms={c.terms} />
      </div>

      <SectionTitle>OnCamera fee</SectionTitle>
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <p className="mb-3 text-sm text-muted-foreground">
          What we invoice this brand on top of creator pay, in bands of the campaign&apos;s total creator pay. Only admins see this.
          {fees.available ? "" : " Run migration 0026 in Supabase before it can be saved."}
        </p>
        <FeeForm jobId={c.id} fee={fees.terms.get(c.id) ?? { bands: [], minimum: 0 }} />
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
