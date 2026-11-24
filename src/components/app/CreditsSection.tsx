import { ExternalLink, Sparkles } from "lucide-react";
import type { CreditProgram, CreditRequest } from "@/lib/tool-credits";
import { formatDate } from "@/lib/utils";
import { CreditsForm } from "./CreditsForm";

/**
 * Free credits on the brand's tool, so creators can show it working in their videos. A creator on the campaign makes
 * a free account and gives us its email; we send the brand the list and the brand tops each account up by hand.
 * Anyone else is told it comes once they're on.
 */
export function CreditsSection({
  program,
  jobId,
  joined,
  request,
}: {
  program: CreditProgram;
  jobId: string;
  joined: boolean;
  request: CreditRequest | null;
}) {
  return (
    <section className="mt-4 rounded-xl border border-border/70 bg-card px-4 py-3 sm:mt-6 sm:px-5 sm:py-4">
      <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
        <Sparkles className="size-4 text-primary" />
        Free {program.brand} credits for your videos
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        Creators on this campaign get free {program.brand} credits, so you can show the tool working in your videos.
      </p>
      {!joined ? (
        <p className="mt-2 text-sm text-muted-foreground">You can ask for your credits once you&apos;re on the campaign.</p>
      ) : (
        <>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-muted-foreground">
            <li>
              Make a free account at{" "}
              <a href={program.signupUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-2">
                {program.signupLabel} <ExternalLink className="inline size-3.5" />
              </a>
              . Already have one? Use that.
            </li>
            <li>Enter the email you signed up with below.</li>
            <li>We send it to {program.brand}, and they add the credits to your account. This can take a few days.</li>
          </ol>
          <div className="mt-3 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm">
            {!request ? (
              <span className="text-muted-foreground">Not sent yet.</span>
            ) : request.sentAt ? (
              <span className="text-foreground">
                Sent to {program.brand} on {formatDate(request.sentAt)} for <strong>{request.toolEmail}</strong>. Your credits should be in
                your account. Not there after a few days? Reply to any email from us.
              </span>
            ) : (
              <span className="text-foreground">
                Waiting: we&apos;ll send <strong>{request.toolEmail}</strong> to {program.brand} with the next list.
              </span>
            )}
          </div>
          <div className="mt-3 max-w-sm">
            <CreditsForm jobId={jobId} brand={program.brand} saved={request?.toolEmail ?? null} />
            {request?.sentAt && (
              <p className="mt-1.5 text-xs text-muted-foreground">Changing it puts the new email on the next list for {program.brand}.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
