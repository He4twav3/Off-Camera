"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Select, Field, Checkbox } from "@/components/ui/field";
import type { Niche } from "@/lib/database.types";

interface JobFiltersProps {
  niches: Pick<Niche, "id" | "slug" | "label">[];
  hasPayRange: boolean;
}

// Filters are always visible inline — "hidden filters" is an explicit
// anti-pattern for this product type.
export function JobFilters({ niches, hasPayRange }: JobFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const activeCount = ["platform", "niche", "payout_type", "account_requirement"]
    .filter((k) => searchParams.get(k))
    .length;

  return (
    <div
      className="rounded-lg border border-border bg-card p-5"
      aria-busy={isPending}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Filter jobs
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="cursor-pointer text-sm font-semibold text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Platform" htmlFor="filter-platform">
          <Select
            id="filter-platform"
            value={searchParams.get("platform") ?? ""}
            onChange={(e) => setParam("platform", e.target.value)}
          >
            <option value="">All platforms</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="x">X</option>
          </Select>
        </Field>

        <Field label="Niche" htmlFor="filter-niche">
          <Select
            id="filter-niche"
            value={searchParams.get("niche") ?? ""}
            onChange={(e) => setParam("niche", e.target.value)}
          >
            <option value="">All niches</option>
            {niches.map((n) => (
              <option key={n.id} value={n.slug}>
                {n.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Payout type" htmlFor="filter-payout-type">
          <Select
            id="filter-payout-type"
            value={searchParams.get("payout_type") ?? ""}
            onChange={(e) => setParam("payout_type", e.target.value)}
          >
            <option value="">Any payout type</option>
            <option value="flat">Flat fee</option>
            <option value="cpm">CPM</option>
            <option value="retainer">Retainer</option>
          </Select>
        </Field>

        <Field label="Account requirement" htmlFor="filter-account">
          <Select
            id="filter-account"
            value={searchParams.get("account_requirement") ?? ""}
            onChange={(e) => setParam("account_requirement", e.target.value)}
          >
            <option value="">Any account</option>
            <option value="new_ok">New accounts OK</option>
            <option value="established_required">Established required</option>
          </Select>
        </Field>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Field label="Sort by" htmlFor="filter-sort" >
          <Select
            id="filter-sort"
            className="sm:max-w-64"
            value={searchParams.get("sort") ?? "newest"}
            onChange={(e) => setParam("sort", e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="payout_desc">Highest payout</option>
            <option value="payout_asc">Lowest payout</option>
          </Select>
        </Field>

        {hasPayRange && (
          <Checkbox
            id="filter-pay-range"
            checked={searchParams.get("my_range") === "1"}
            onChange={(e) => setParam("my_range", e.target.checked ? "1" : "")}
            label="Only show jobs in my preferred pay range"
          />
        )}
      </div>
    </div>
  );
}
