import type { ReactNode } from "react";
import Link from "next/link";
import { Link2, Settings, User, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccountSection =
  "profile" | "accounts" | "videos" | "payments" | "settings";

const SECTIONS: {
  key: AccountSection;
  label: string;
  href: string;
  icon: typeof User;
}[] = [
  {
    key: "profile",
    label: "Profile",
    href: "/dashboard/recruiting/profile-setup",
    icon: User,
  },
  {
    key: "accounts",
    label: "Accounts",
    href: "/dashboard/account/accounts",
    icon: Link2,
  },
  {
    key: "videos",
    label: "Videos",
    href: "/dashboard/account/videos",
    icon: Video,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/dashboard/account",
    icon: Settings,
  },
];

export function Avatar({
  name,
  url,
  size,
}: {
  name: string;
  url?: string | null;
  size: number;
}) {
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-muted font-heading font-semibold text-foreground"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {letter}
    </span>
  );
}

/**
 * The account area: a left panel (picture, name, @username and the sections) and a
 * main column with a titled header. Every account page sits inside this.
 */
export function AccountShell({
  active,
  person,
  title,
  summary,
  icon: Icon,
  hrefFor = (s) => s.href,
  children,
}: {
  active: AccountSection;
  person: { name: string; username: string | null; avatarUrl?: string | null };
  title: string;
  summary: string;
  icon: typeof User;
  hrefFor?: (s: (typeof SECTIONS)[number]) => string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col lg:min-h-[calc(100vh-3.5rem)] lg:flex-row">
      <aside className="shrink-0 border-b border-border/70 lg:w-60 lg:border-r lg:border-b-0">
        <div className="flex flex-col items-center px-4 pt-6 pb-4 text-center lg:pt-8">
          <Avatar name={person.name} url={person.avatarUrl} size={88} />
          <p className="mt-3 font-heading text-lg font-semibold text-foreground">
            {person.name}
          </p>
          {person.username && (
            <p className="text-sm text-muted-foreground">@{person.username}</p>
          )}
        </div>
        <nav
          aria-label="Account"
          className="flex gap-1 overflow-x-auto border-t border-border/70 px-3 py-3 lg:flex-col lg:overflow-visible"
        >
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              href={hrefFor(s)}
              aria-current={s.key === active ? "page" : undefined}
              className={cn(
                "flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                s.key === active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <s.icon className="size-4 shrink-0" />
              {s.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-semibold text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{summary}</p>
          </div>
        </header>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}

/** A titled card with a divider under the heading: the building block of every account page. */
export function Section({
  title,
  summary,
  aside,
  id,
  children,
}: {
  title: ReactNode;
  summary?: string;
  aside?: ReactNode;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-xl border border-border/70 bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-6 py-5">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {title}
          </h2>
          {summary && (
            <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
          )}
        </div>
        {aside}
      </div>
      <div className="flex flex-col gap-5 px-6 py-6">{children}</div>
    </section>
  );
}
