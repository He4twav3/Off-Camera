"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type SessionState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "authed"; email: string; initials: string };

function useClientSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { loggedIn: boolean; email?: string; initials?: string }) => {
        if (cancelled) return;
        setState(
          data.loggedIn && data.email && data.initials
            ? { status: "authed", email: data.email, initials: data.initials }
            : { status: "anon" }
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "anon" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { session: state };
}

/** Desktop pill next to the other nav links. */
export function AuthNavPill() {
  const { session } = useClientSession();

  if (session.status === "loading") {
    return <span className="h-[34px] w-[92px] shrink-0 rounded-full bg-secondary/60" aria-hidden />;
  }

  if (session.status === "authed") {
    return (
      <Link
        href="/"
        title={session.email}
        className="pill-premium focus-premium flex items-center gap-1.5 rounded-full bg-surface-1/70 px-3.5 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Avatar className="-ml-1 size-5">
          <AvatarFallback className="bg-surface-3 text-[10px] font-medium text-foreground">
            {session.initials}
          </AvatarFallback>
        </Avatar>
        My account
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="pill-premium focus-premium rounded-full bg-surface-1/70 px-3.5 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      Log in
    </Link>
  );
}

/** Full-width row for the mobile sheet menu. `onNavigate` closes the
 * enclosing sheet — this row triggers a route change either way
 * (client-side `router.push` on logout, or a plain Link on log in),
 * neither of which the sheet notices on its own. */
export function AuthNavRow({
  onNavigate,
  className,
}: { onNavigate?: () => void; className?: string } = {}) {
  const { session } = useClientSession();

  if (session.status === "loading") {
    return <div className={cn("h-[42px] rounded-full bg-secondary/60", className)} aria-hidden />;
  }

  if (session.status === "authed") {
    return (
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "pill-premium focus-premium flex items-center gap-2.5 rounded-full bg-surface-1/70 px-3.5 py-2 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-2 hover:text-foreground",
          className
        )}
      >
        My account ({session.email})
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      onClick={onNavigate}
      className={cn(
        "pill-premium focus-premium rounded-full bg-surface-1/70 px-3.5 py-2 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-2 hover:text-foreground",
        className
      )}
    >
      Log in
    </Link>
  );
}
