import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, PageShell } from "@/components/kit/ui";
import { LogoutButtonStyled } from "@/components/dashboard/logout-button";
import { ChangePasswordForm } from "@/app/dashboard/account/change-password-form";
import { BusinessForm } from "../BusinessForm";
import { requireBrand } from "../_brand";

export const metadata: Metadata = { title: "Settings" };

export default async function BrandSettingsPage() {
  const brand = await requireBrand("/brand/settings");
  const supabase = await createClient();
  const [{ data: row }, { data: auth }] = await Promise.all([
    supabase.from("brand_accounts").select("website").eq("id", brand.id).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const section = "rounded-xl border border-border/70 bg-card p-5";
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Settings" />
        <div className="flex flex-col gap-6">
          <section className={section}>
            <h2 className="font-heading text-base font-semibold text-foreground">Business details</h2>
            <div className="mt-4">
              <BusinessForm company={brand.companyName} contact={brand.contactName} website={row?.website ?? null} />
            </div>
          </section>

          <section className={section}>
            <h2 className="font-heading text-base font-semibold text-foreground">Sign-in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{auth.user?.email}</span>
            </p>
            <div className="mt-4 max-w-sm">
              <ChangePasswordForm />
            </div>
          </section>

          <section className={section}>
            <h2 className="font-heading text-base font-semibold text-foreground">Log out</h2>
            <div className="mt-3 max-w-xs">
              <LogoutButtonStyled className="w-full" />
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
