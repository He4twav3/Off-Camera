"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

  return { session: state, setSession: setState };
}

/**
 * A plain `<Link href="/logout">` breaks when you're already on the page
 * you land back on: `/` → `/logout` → `/` is the same route, so a client
 * component that only fetches its session on mount never re-runs and the
 * pill keeps showing "Log out" even though the cookie is really gone.
 * Logging out explicitly here — hit the route, flip local state, then
 * navigate — fixes that regardless of which page it's clicked from.
 */
function useLogout(setSession: (s: SessionState) => void) {
  const router = useRouter();
  return async () => {
    setSession({ status: "anon" });
    await fetch("/logout", { cache: "no-store" }).catch(() => {});
    router.push("/");
    router.refresh();
  };
}

/** Desktop pill next to the other nav links. */
export function AuthNavPill() {
  const { session, setSession } = useClientSession();
  const logout = useLogout(setSession);

  if (session.status === "loading") {
    return <span className="h-[34px] w-[92px] shrink-0 rounded-full bg-secondary/60" aria-hidden />;
  }

  if (session.status === "authed") {
    return (
      <button
        type="button"
        onClick={logout}
        title={`Log out (${session.email})`}
        className="pill-premium focus-premium flex items-center gap-1.5 rounded-full bg-surface-1/70 px-3.5 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Avatar className="-ml-1 size-5">
          <AvatarFallback className="bg-surface-3 text-[10px] font-medium text-foreground">
            {session.initials}
          </AvatarFallback>
        </Avatar>
        Log out
      </button>
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
export function AuthNavRow({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { session, setSession } = useClientSession();
  const logout = useLogout(setSession);

  if (session.status === "loading") {
    return <div className="h-[42px] rounded-full bg-secondary/60" aria-hidden />;
  }

  if (session.status === "authed") {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          logout();
        }}
        className="pill-premium focus-premium flex items-center gap-2.5 rounded-full bg-surface-1/70 px-3.5 py-2 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <LogOut className="size-4" />
        Log out ({session.email})
      </button>
    );
  }

  return (
    <Link
      href="/login"
      onClick={onNavigate}
      className="pill-premium focus-premium rounded-full bg-surface-1/70 px-3.5 py-2 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      Log in
    </Link>
  );
}
