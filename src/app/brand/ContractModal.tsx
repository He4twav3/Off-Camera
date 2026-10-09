import type { ReactNode } from "react";

/**
 * The contract as a pop-up over the brand's screen. It has no close button: the brand has to agree first. The page
 * behind it is not even rendered (see app/brand/layout.tsx), so there is nothing to click through to. Log out stays.
 */
export function ContractModal({ children }: { children: ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Sign your contract" className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-2xl items-start px-3 py-6 sm:items-center sm:px-4 sm:py-10">
        <div className="w-full rounded-2xl border border-border bg-background p-4 shadow-2xl sm:p-6">
          <h1 className="font-heading text-xl font-semibold text-foreground">Sign your contract to continue</h1>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            This comes first. Fill in your company details and agree. Your account opens as soon as it is saved.
          </p>
          {children}
          <form action="/auth/signout" method="post" className="mt-2 text-right">
            <input type="hidden" name="next" value="/login" />
            <button type="submit" className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Log out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
