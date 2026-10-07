import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, applicantStatusTone } from "@/components/ui/status-badge";
import { PLATFORM_LABELS } from "@/lib/utils";
import type { PlatformEnum } from "@/lib/database.types";

export type ProfileHandle = { platform: PlatformEnum; handle: string; is_primary: boolean; verified_at: string | null };

/** The creator's profile at the top of their dashboard: full name, handles, status. */
export function ProfileSummary({
  name,
  statusLabel,
  status,
  handles,
  location,
}: {
  name: string;
  status: string;
  statusLabel: string;
  handles: ProfileHandle[];
  location?: string | null;
}) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <section className="rounded-xl border border-border/70 bg-card p-5">
      <div className="flex flex-wrap items-start gap-4">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-xl font-semibold text-primary"
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-semibold text-foreground">{name}</h2>
            <StatusBadge tone={applicantStatusTone(status)}>{statusLabel}</StatusBadge>
          </div>
          {location && <p className="mt-0.5 text-sm text-muted-foreground">{location}</p>}
          {handles.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No handles yet. Add them in your profile.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {handles.map((h) => (
                <li
                  key={`${h.platform}-${h.handle}`}
                  className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-sm text-foreground"
                >
                  <span className="text-muted-foreground">{PLATFORM_LABELS[h.platform]}</span> @{h.handle}
                  {h.verified_at && <span className="ml-1.5 text-xs font-semibold text-toy-soft-foreground">verified</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/dashboard/recruiting/profile-setup" />}>
          <Pencil size={14} />
          Edit profile
        </Button>
      </div>
    </section>
  );
}
