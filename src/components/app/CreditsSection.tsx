import { ExternalLink, Sparkles } from "lucide-react";
import type { CreditProgram, CreditRequest } from "@/lib/tool-credits";
import { formatDate } from "@/lib/utils";
import { CreditsForm } from "./CreditsForm";

/**
 * Free credits on the brand's tool, so creators can show it working in their videos. A creator on the campaign signs
 * up through here: they give the email they'll use, it's saved for the brand's list, and they're sent on to the
 * brand's sign-up page. We send the brand the list and the brand tops each account up by hand. Anyone else is told it
 * comes once they're on.
 */
export function CreditsSection({
  program,
  jobId,
  joined,
  request,
  defaultEmail,
}: {
  program: CreditProgram;
  jobId: string;
  joined: boolean;
  request: CreditRequest | null;
  /** Their On Camera email, offered as the one to sign up with. */
  defaultEmail: string;
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
        <p className="mt-2 text-sm text-muted-foreground">You can sign up for your credits once you&apos;re on the campaign.</p>
      ) : !request ? (
        <>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-muted-foreground">
            <li>Check the email below. It&apos;s the one {program.brand} will add your credits to.</li>
            <li>
              Click <strong className="text-foreground">Continue to {program.brand}</strong> and sign up there with{" "}
              <strong className="text-foreground">that same email</strong>. Already have an account with it? Just sign in.
            </li>
            <li>We send your email to {program.brand}, and they add the credits to your account. This can take a few days.</li>
          </ol>
          <div className="mt-4 max-w-sm">
            <CreditsForm jobId={jobId} brand={program.brand} initial={defaultEmail} mode="continue" />
          </div>
        </>
      ) : (
        <>
          <div className="mt-3 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm">
            {request.sentAt ? (
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
          <p className="mt-3 text-sm text-muted-foreground">
            Haven&apos;t made your account yet?{" "}
            <a href={program.signupUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-2">
              Sign up to {program.signupLabel} <ExternalLink className="inline size-3.5" />
            </a>{" "}
            with <strong className="text-foreground">{request.toolEmail}</strong>.
          </p>
          <div className="mt-3 max-w-sm">
            <CreditsForm jobId={jobId} brand={program.brand} initial={request.toolEmail} mode="change" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Signed up with a different email? Change it here{request.sentAt ? `, and it goes on the next list for ${program.brand}` : ""}.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
