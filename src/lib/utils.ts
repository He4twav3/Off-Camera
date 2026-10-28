import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Recruiting-domain formatters (ported from CreatorRoster) -------------
// Brand-campaign payouts are USD regardless of the course price's own
// currency (EUR) — two separate money domains, not a mismatch to reconcile.

// Whole dollars stay short ($96); anything with cents always shows two digits ($182.40, never $182.4).
export function formatCurrency(amount: number) {
  const cents = Math.round(amount * 100) % 100 !== 0
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso))
}

// Applicant-facing payout summary. Deliberately renders only the flat figure
// stored on the job/assignment — there is no code path here that could
// surface gross_amount or any commission math.
export function formatPayoutSummary(
  payoutType: "flat" | "cpm" | "retainer",
  amount: number
) {
  switch (payoutType) {
    case "flat":
      return `${formatCurrency(amount)} flat`
    case "cpm":
      return `${formatCurrency(amount)} CPM`
    case "retainer":
      return `${formatCurrency(amount)}/mo retainer`
  }
}

export const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube Shorts",
  x: "X",
}

export const PAYOUT_TYPE_LABELS: Record<string, string> = {
  flat: "Flat fee",
  cpm: "CPM",
  retainer: "Retainer",
}

export const ACCOUNT_REQUIREMENT_LABELS: Record<string, string> = {
  new_ok: "New accounts OK",
  established_required: "Established account required",
}
