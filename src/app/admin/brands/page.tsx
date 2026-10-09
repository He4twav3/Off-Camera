import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { Body, Head, Table, Td, Th } from "@/components/admin/table";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { formatDate } from "@/lib/utils";
import { BrandActions } from "./BrandActions";
import { deleteBrandAction } from "../delete-actions";

export const metadata: Metadata = { title: "Brands · Admin" };

const TONE = { pending: "pending", approved: "success", rejected: "error" } as const;
const LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" } as const;

export default async function AdminBrandsPage() {
  const supabase = await createClient();
  const [{ data: brands }, { data: jobs }] = await Promise.all([
    supabase.from("brand_accounts").select("*").order("created_at", { ascending: false }),
    supabase.from("jobs").select("brand_account_id, title").not("brand_account_id", "is", null),
  ]);
  const all = brands ?? [];
  const campaigns = (id: string) => (jobs ?? []).filter((j) => j.brand_account_id === id);
  const rows = [...all.filter((b) => b.status === "pending"), ...all.filter((b) => b.status !== "pending")];
  const pending = all.filter((b) => b.status === "pending").length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-4">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Brands</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pending} awaiting review · {all.length} total. Approved brands can be attached to a campaign from its page. A brand can be
          deleted only when it has no campaigns.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No brands yet. They appear when someone signs up as a brand.
        </p>
      ) : (
        <Table min="52rem">
          <Head>
            <Th>Brand</Th>
            <Th>Contact</Th>
            <Th>Status</Th>
            <Th>Campaigns</Th>
            <Th>Signed up</Th>
            <Th>Actions</Th>
          </Head>
          <Body>
            {rows.map((b) => {
              const mine = campaigns(b.id);
              return (
                <tr key={b.id} className="hover:bg-muted/30">
                  <Td className="py-2">
                    <span className="font-medium text-foreground">{b.company_name}</span>
                    {b.website && (
                      <a href={b.website} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline">
                        {b.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </Td>
                  <Td className="py-2" muted>{b.contact_name}</Td>
                  <Td className="py-2">
                    <StatusBadge tone={TONE[b.status]}>{LABEL[b.status]}</StatusBadge>
                  </Td>
                  <Td className="py-2" muted>{mine.length === 0 ? "None" : mine.map((m) => m.title).join(", ")}</Td>
                  <Td className="py-2" muted>{formatDate(b.created_at)}</Td>
                  <Td className="py-2">
                    <div className="flex flex-col gap-1.5">
                      <BrandActions id={b.id} status={b.status} />
                      <ConfirmDelete action={deleteBrandAction} id={b.id} what={b.company_name} />
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Body>
        </Table>
      )}
    </div>
  );
}
