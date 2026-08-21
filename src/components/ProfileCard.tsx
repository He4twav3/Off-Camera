import {
  CheckCircle2,
  MapPin,
  GraduationCap,
  Sparkles,
  Link2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatCurrency, PLATFORM_LABELS } from "@/lib/utils";
import { ageFromDob, formatFollowers, PLATFORM_RULES } from "@/lib/handles";
import type { Applicant, ApplicantHandle } from "@/lib/database.types";

interface ProfileCardProps {
  applicant: Applicant & { niches?: { label: string } | null };
  handles: ApplicantHandle[];
  /**
   * Admin view surfaces contact details and the unverified-claim caveats.
   * The creator's own preview hides them, since they already know their email.
   */
  variant?: "admin" | "self";
  className?: string;
}

// The "resume" — one card summarising a creator, used in three places: their
// own dashboard preview, the apply confirmation, and your review queue.
// Deliberately reads the profile live rather than snapshotting it, so an
// improved profile lifts every application they've already sent.
export function ProfileCard({
  applicant: a,
  handles,
  variant = "self",
  className,
}: ProfileCardProps) {
  const age = ageFromDob(a.date_of_birth);
  const isAdmin = variant === "admin";

  const primary = handles.find((h) => h.is_primary) ?? handles[0];
  const others = handles.filter((h) => h.id !== primary?.id);
  const ordered = primary ? [primary, ...others] : [];

  const payRange = formatPayRange(a.preferred_pay_min, a.preferred_pay_max);

  return (
    <Card className={cn("border-border/70", className)}>
      <CardContent className="flex flex-col gap-6">
      {/* Identity */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-heading text-xl font-semibold leading-tight text-foreground">
            {a.name}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-muted-foreground">
            {a.username && (
              <span className="font-semibold text-foreground">
                @{a.username}
              </span>
            )}
            {age !== null && <span>{age} years old</span>}
            {a.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={15} />
                {a.location}
              </span>
            )}
          </p>
          {isAdmin && (
            <p className="mt-1 text-sm text-muted-foreground">{a.email}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {a.niches?.label && <StatusBadge tone="neutral">{a.niches.label}</StatusBadge>}
          {a.years_creating !== null && (
            <StatusBadge tone="open">
              {a.years_creating < 1
                ? "Under a year creating"
                : `${trimZero(a.years_creating)} ${a.years_creating === 1 ? "year" : "years"} creating`}
            </StatusBadge>
          )}
        </div>
      </div>

      {/* Handles */}
      {ordered.length > 0 && (
        <section>
          <SectionLabel>Where they post</SectionLabel>
          <ul className="mt-3 flex flex-col gap-2">
            {ordered.map((h) => {
              const url =
                h.profile_url ?? PLATFORM_RULES[h.platform].profileUrl(h.handle);
              const followers = formatFollowers(h.follower_count);
              return (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted/50 px-4 py-2.5"
                >
                  <span className="text-sm font-semibold text-muted-foreground">
                    {PLATFORM_LABELS[h.platform]}
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80"
                  >
                    @{h.handle}
                    <Link2 size={14} />
                  </a>
                  {followers && (
                    <span className="text-sm text-muted-foreground">
                      {followers} followers
                    </span>
                  )}
                  {h.is_primary && ordered.length > 1 && (
                    <StatusBadge tone="neutral">Main</StatusBadge>
                  )}
                  {h.verified_at ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-toy-soft-foreground">
                      <CheckCircle2 size={15} />
                      Checked
                    </span>
                  ) : (
                    isAdmin && (
                      <span className="text-sm text-muted-foreground">
                        Not checked yet
                      </span>
                    )
                  )}
                </li>
              );
            })}
          </ul>
          {isAdmin && (
            <p className="mt-2 text-sm text-muted-foreground">
              Handles and follower counts are self-reported. Open the links to
              confirm before assigning anything.
            </p>
          )}
        </section>
      )}

      {/* Experience */}
      {(a.experience_summary ||
        a.brands_worked_with.length > 0 ||
        a.content_types.length > 0 ||
        a.skills.length > 0) && (
        <section>
          <SectionLabel>Experience</SectionLabel>

          {a.experience_summary && (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground">
              {a.experience_summary}
            </p>
          )}

          {a.brands_worked_with.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-muted-foreground">
                Brands worked with
              </p>
              <p className="mt-1 text-[15px] text-foreground">
                {a.brands_worked_with.join(" · ")}
              </p>
            </div>
          )}

          {(a.content_types.length > 0 || a.skills.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {a.content_types.map((c) => (
                <StatusBadge key={c} tone="neutral">
                  {c}
                </StatusBadge>
              ))}
              {a.skills.map((s) => (
                <StatusBadge key={s} tone="neutral">
                  <Sparkles size={13} />
                  {s}
                </StatusBadge>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Education */}
      {(a.education_level || a.education) && (
        <section>
          <SectionLabel>Education</SectionLabel>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-[15px] text-foreground">
            <GraduationCap size={18} className="text-muted-foreground" />
            {a.education_level && <span>{a.education_level}</span>}
            {a.education && (
              <span className="text-muted-foreground">{a.education}</span>
            )}
          </p>
        </section>
      )}

      {/* Bio */}
      {a.bio && (
        <section>
          <SectionLabel>About</SectionLabel>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground">
            {a.bio}
          </p>
        </section>
      )}

      {/* Practicalities */}
      <section className="border-t border-border pt-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-muted-foreground">
              Rate they&apos;re looking for
            </dt>
            <dd className="mt-0.5 text-[15px] text-foreground">{payRange}</dd>
          </div>
          {a.languages.length > 0 && (
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">
                Languages
              </dt>
              <dd className="mt-0.5 text-[15px] text-foreground">
                {a.languages.join(", ")}
              </dd>
            </div>
          )}
          {a.availability_notes && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-muted-foreground">
                Availability
              </dt>
              <dd className="mt-0.5 text-[15px] text-foreground">
                {a.availability_notes}
              </dd>
            </div>
          )}
          {a.portfolio_url && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold text-muted-foreground">
                Portfolio
              </dt>
              <dd className="mt-0.5">
                <a
                  href={a.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-semibold text-primary underline underline-offset-2 break-all"
                >
                  {a.portfolio_url}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </section>
      </CardContent>
    </Card>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </h4>
  );
}

function trimZero(n: number) {
  return String(n).replace(/\.0$/, "");
}

function formatPayRange(min: number | null, max: number | null) {
  if (min === null && max === null) return "Open to anything";
  if (min !== null && max !== null)
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  if (min !== null) return `${formatCurrency(min)} and up`;
  return `Up to ${formatCurrency(max!)}`;
}
