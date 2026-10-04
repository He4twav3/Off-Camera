import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getBrandCampaigns } from "@/lib/brand-data";
import { PLATFORM_LABELS, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Your campaigns" };

const CREATOR_STATUS: Record<string, string> = {
  active: "In progress",
  submitted: "Post submitted",
  paid: "Completed",
  disputed: "Needs attention",
};

export default async function BrandDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/brand");

  // RLS: a brand can only read its own account row.
  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, company_name, contact_name, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) redirect("/dashboard");

  const firstName = brand.contact_name.split(" ")[0];
  const campaigns = brand.status === "approved" ? await getBrandCampaigns(brand.id) : [];
  const creatorCount = campaigns.reduce((n, c) => n + c.creators.length, 0);
  const totalViews = campaigns.reduce((n, c) => n + c.totalViews, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:py-10">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Hi, {firstName}</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">{brand.company_name}</p>
      </header>

      {brand.status !== "approved" ? (
        <Card className="border-border/70 py-10 text-center">
          <CardContent>
            <Clock size={28} className="mx-auto text-accent" />
            <h2 className="mt-3 font-heading text-lg font-semibold">
              {brand.status === "pending" ? "Your account is under review" : "Your account wasn’t approved"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              {brand.status === "pending"
                ? "We review new brands by hand, usually within a day or two. You'll be able to see your campaigns here as soon as you're approved."
                : "If you think that's a mistake, get in touch and we'll take another look."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <dl className="mb-8 grid grid-cols-3 gap-3">
            <Stat label="Campaigns" value={campaigns.length.toLocaleString()} />
            <Stat label="Creators" value={creatorCount.toLocaleString()} />
            <Stat label="Total views" value={totalViews.toLocaleString()} />
          </dl>

          {campaigns.length === 0 ? (
            <Card className="border-border/70 py-10 text-center">
              <CardContent>
                <h2 className="font-heading text-lg font-semibold">No campaigns yet</h2>
                <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  Your campaigns will appear here once we set them up with you.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-5">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <Card className="border-border/70">
                    <CardContent>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="font-heading text-lg font-semibold">{c.title}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {PLATFORM_LABELS[c.platform]} · Started {formatDate(c.createdAt)} ·{" "}
                            {c.status === "open" ? "Open" : c.status === "filled" ? "Filled" : "Closed"}
                          </p>
                        </div>
                        <p className="text-right">
                          <span className="font-heading text-2xl font-semibold tabular-nums">
                            {c.totalViews.toLocaleString()}
                          </span>
                          <span className="block text-xs text-muted-foreground">views</span>
                        </p>
                      </div>

                      {c.creators.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">No creators on this campaign yet.</p>
                      ) : (
                        <ul className="mt-4 divide-y divide-border">
                          {c.creators.map((cr) => (
                            <li key={cr.assignmentId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                              <div className="min-w-0">
                                <p className="truncate text-[15px] font-semibold">{cr.name}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                  {PLATFORM_LABELS[cr.platform]} @{cr.handle} · {CREATOR_STATUS[cr.status]}
                                  {cr.proofUrl && (
                                    <>
                                      {" · "}
                                      <a
                                        href={cr.proofUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-primary underline underline-offset-2"
                                      >
                                        View post
                                      </a>
                                    </>
                                  )}
                                </p>
                              </div>
                              <p className="tabular-nums text-[15px] font-semibold">
                                {cr.views.toLocaleString()}{" "}
                                <span className="text-xs font-normal text-muted-foreground">views</span>
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-heading text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
