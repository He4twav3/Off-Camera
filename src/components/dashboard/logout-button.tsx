"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Never a plain `<Link href="/logout">` — /logout is a GET route that
 * really signs you out as a side effect of the request, and Next.js
 * prefetches any <Link> sitting in the viewport automatically. A sidebar
 * (or any nav) that always renders the logout link would get it prefetched
 * within moments of every page load, silently killing the session before
 * anyone actually clicked anything — confirmed live: the auth cookie was
 * getting cleared by a background `/logout?_rsc=...` prefetch request
 * seconds after a real login, well before any real navigation. Same fix
 * already established in auth-nav-status.tsx's useLogout — a plain button
 * is never a prefetch target, only <Link> is.
 */
function useLogout() {
  const router = useRouter();
  return async () => {
    await fetch("/logout", { cache: "no-store" }).catch(() => {});
    router.push("/");
    router.refresh();
  };
}

/** Bare version — sidebar/drawer rows, no Button chrome of their own. */
export function LogoutButton({ className }: { className?: string }) {
  const logout = useLogout();
  return (
    <button
      type="button"
      onClick={logout}
      className={cn(
        "flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <LogOut className="size-4 shrink-0" />
      Log out
    </button>
  );
}

/** Styled version — for places that want the real Button component's own
 * variants (e.g. the account page's full-width outline button). */
export function LogoutButtonStyled({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "outline" | "default" | "ghost" | "destructive";
}) {
  const logout = useLogout();
  return (
    <Button type="button" variant={variant} onClick={logout} className={className}>
      <LogOut />
      Log out
    </Button>
  );
}
