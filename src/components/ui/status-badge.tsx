import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Status pills for the recruiting dashboard/admin panel. On Camera's
// palette is deliberately monochromatic (crimson + neutrals, no
// traffic-light red/green/yellow) — see globals.css's --toy-* scale — so
// tones map onto that instead of introducing a foreign green/red system.
// Status is always color + text label together, never color alone.
export type StatusTone =
  | "open"
  | "success"
  | "pending"
  | "closed"
  | "error"
  | "neutral"

const TONE_CLASSES: Record<StatusTone, string> = {
  open: "border-transparent bg-toy-soft text-toy-soft-foreground",
  success: "border-transparent bg-toy-soft text-toy-soft-foreground",
  pending: "border-transparent bg-accent text-accent-foreground",
  closed: "border-transparent bg-muted text-muted-foreground",
  error: "border-transparent bg-destructive/10 text-destructive",
  neutral: "border-transparent bg-muted text-muted-foreground",
}

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: StatusTone
  children: ReactNode
  className?: string
}) {
  return <Badge className={cn(TONE_CLASSES[tone], className)}>{children}</Badge>
}

export function jobStatusTone(status: string): StatusTone {
  if (status === "open") return "open"
  return "closed"
}

export function assignmentStatusTone(status: string): StatusTone {
  switch (status) {
    case "active":
      return "open"
    case "submitted":
      return "pending"
    case "paid":
      return "success"
    case "disputed":
      return "error"
    default:
      return "neutral"
  }
}

export function applicantStatusTone(status: string): StatusTone {
  switch (status) {
    case "approved":
      return "success"
    case "pending":
      return "pending"
    case "rejected":
      return "error"
    default:
      return "neutral"
  }
}

export function applicationStatusTone(status: string): StatusTone {
  switch (status) {
    case "accepted":
      return "success"
    case "pending":
      return "pending"
    case "declined":
      return "error"
    case "withdrawn":
      return "closed"
    default:
      return "neutral"
  }
}
