import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/dashboard/logout-button";

/** Pinned to the foot of the sidebar rail (and reused inside the mobile
 * drawer) — who's signed in, and the one way out. */
export function SidebarAccount({
  displayName,
  email,
  initials,
}: {
  displayName: string;
  email: string;
  initials: string;
}) {
  return (
    <div className="border-t border-border pt-3">
      <div className="flex items-center gap-3 rounded-lg px-3 py-2">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="bg-primary/15 text-sm font-medium text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{displayName}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </span>
      </div>
      <LogoutButton />
    </div>
  );
}
