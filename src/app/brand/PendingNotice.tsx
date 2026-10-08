import { EmptyState } from "@/components/kit/ui";

/** Shown instead of the page while a brand account is still being reviewed. */
export function PendingNotice({ status }: { status: "pending" | "approved" | "rejected" }) {
  return (
    <EmptyState
      title={status === "pending" ? "Your account is under review" : "Your account wasn’t approved"}
      body={
        status === "pending"
          ? "We review new brands by hand, usually within a day or two. You can set up campaigns as soon as you're approved."
          : "If you think that's a mistake, get in touch and we'll take another look."
      }
    />
  );
}
