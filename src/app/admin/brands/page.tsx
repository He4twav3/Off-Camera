import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { BrandActions } from "./BrandActions";

export const metadata: Metadata = { title: "Brands · Admin" };

export default async function AdminBrandsPage() {
  const supabase = await createClient();
  const [{ data: brands }, { data: jobs }] = await Promise.all([
    supabase.from("brand_accounts").select("*").order("created_at", { ascending: false }),
    supabase.from("jobs").select("brand_account_id").not("brand_account_id", "is", null),
  ]);

  const campaignCount = (id: string) => (jobs ?? []).filter((j) => j.brand_account_id === id).length;
  const pending = brands?.filter((b) => b.status === "pending").length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Brands</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {pending} awaiting review · {brands?.length ?? 0} total. Approved brands can be attached to a
          campaign from the Jobs page.
        </p>
      </header>

      {!brands || brands.length === 0 ? (
        <Card className="border-border/70 py-12 text-center">
          <CardContent>
            <h2 className="font-heading text-xl font-semibold text-foreground">No brands yet</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
              They show up here when someone signs up at /create-account?type=brand.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {brands.map((b) => (
            <li key={b.id}>
              <Card className="border-border/70">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1 text-[15px]">
                    <p className="font-semibold text-foreground">
                      {b.company_name}{" "}
                      <span className="font-normal text-muted-foreground">· {b.status}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {b.contact_name}
                      {b.website && (
                        <>
                          {" · "}
                          <a href={b.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                            {b.website.replace(/^https?:\/\//, "")}
                          </a>
                        </>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Signed up {formatDate(b.created_at)} · {campaignCount(b.id)} campaign
                      {campaignCount(b.id) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <BrandActions id={b.id} status={b.status} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
