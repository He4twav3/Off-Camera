import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { NicheManager } from "./NicheManager";

export const metadata: Metadata = { title: "Niches · Admin" };

export default async function AdminNichesPage() {
  const supabase = await createClient();

  const [{ data: niches }, { data: jobs }] = await Promise.all([
    supabase.from("niches").select("*").order("label"),
    supabase.from("jobs").select("niche_id"),
  ]);

  // Count campaigns per niche so you can see what's actually in use before
  // archiving something.
  const counts = new Map<string, number>();
  for (const j of jobs ?? []) {
    counts.set(j.niche_id, (counts.get(j.niche_id) ?? 0) + 1);
  }

  const rows = (niches ?? []).map((n) => ({
    id: n.id,
    slug: n.slug,
    label: n.label,
    is_active: n.is_active,
    jobCount: counts.get(n.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Niches
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          The categories creators pick from and the job board filters on.
        </p>
      </header>

      <NicheManager niches={rows} />
    </div>
  );
}
