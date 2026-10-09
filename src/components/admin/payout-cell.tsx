import { CopyButton } from "@/components/admin/copy-button";
import type { APayout } from "@/lib/admin-workspace";

/** Where this creator is paid: the provider, a link to open it, and a copy button. */
export function PayoutCell({ payout }: { payout: APayout }) {
  if (payout.link) {
    return (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="font-medium text-foreground">{payout.provider}</span>
        <a href={payout.link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">
          Open
        </a>
        <CopyButton value={payout.link} label="Copy link" />
      </span>
    );
  }
  if (payout.raw) {
    return (
      <span className="flex flex-wrap items-center gap-x-3">
        <span className="max-w-48 truncate text-muted-foreground" title={payout.raw}>
          {payout.raw}
        </span>
        <CopyButton value={payout.raw} />
      </span>
    );
  }
  return <span className="text-muted-foreground">Not added yet</span>;
}
