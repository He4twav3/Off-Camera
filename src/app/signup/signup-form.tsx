"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownBadge } from "@/components/marketing/countdown-badge";
import { DiscordIcon } from "@/components/site/discord-link";
import { siteConfig } from "@/lib/site-config";
import { saveSpot, type SaveSpotState } from "./actions";

const initialState: SaveSpotState = {};

/**
 * Owns the page's entire swappable content — not just the `<form>` — so
 * the countdown/urgency copy and the capture form disappear together the
 * moment `state.sent` flips true, replaced by one confirmation screen
 * rather than a success card bolted onto a layout still built to sell the
 * signup itself. A countdown still ticking above "you're all set" would
 * be telling two different stories about the same visit.
 *
 * The confirmation screen is deliberately two beats, not four: one big
 * "you're all signed up," then a single small line underneath it — not a
 * bordered "check your email" card AND a separate Discord pitch AND a
 * button all stacked up competing for the same one thing a visitor
 * actually reads at this moment. That one small line does the one job
 * that matters right now: get them into Discord immediately rather than
 * after they've read a sign-in email and come back — community calls and
 * onboarding happen there, not on this site. The sign-in link is still
 * real and still needed, so it survives as the smallest text on the
 * screen, not the headline act. `siteConfig.communityUrl` gates the
 * Discord half entirely, same honesty rule discord-link.tsx uses: nothing
 * here promises a Discord that doesn't exist yet — the email confirmation
 * alone covers that case instead.
 */
export function SignupForm() {
  const [state, formAction, pending] = useActionState(saveSpot, initialState);

  if (state.sent) {
    return (
      <div className="mx-auto w-full max-w-sm text-center">
        {/* The one big beat — everything else on this screen is a single
            small line underneath it, not a second competing headline. */}
        <p className="text-3xl font-bold tracking-tight text-foreground text-balance">
          You&apos;re all signed up!
        </p>

        {siteConfig.communityUrl ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Join the Discord now — that&apos;s where community calls and
              onboarding actually happen.
            </p>
            <Button
              size="lg"
              nativeButton={false}
              render={
                <Link
                  href={siteConfig.communityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              className="btn-cta-glass mt-3 h-auto w-full rounded-full py-3.5 text-base font-bold tracking-tight text-cta-foreground"
            >
              <DiscordIcon className="size-4" />
              Join free on Discord
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              We also emailed you a sign-in link for your account.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Check your email — we sent you a sign-in link to get straight
            into the course.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm text-center">
      <CountdownBadge />

      <p className="mt-4 text-sm text-muted-foreground">
        Real lessons from the course — hooks, retention, and the mechanics
        behind our real videos.
      </p>

      <form action={formAction} className="mt-4 flex flex-col gap-3" aria-label="Save your spot">
        <label className="sr-only" htmlFor="signup-email">
          Email address
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="h-11 w-full rounded-lg border-2 border-ink bg-card px-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {state.error && (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        )}
        <Button type="submit" size="lg" disabled={pending} className="btn-sticker w-full">
          {pending ? "Saving your spot…" : "Save your spot"}
          {!pending && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <p className="mt-3 text-xs text-muted-foreground">
        One link, sent once. No spam, no card required.
      </p>

      {/* Hidden on the shortest phones (a custom max-height variant, not
          a width one — this is the one spot on the page where the
          constraint is genuinely vertical room, not screen width)
          rather than shrunk further: at some point another round of
          smaller type stops being "compact" and starts being illegible,
          and this block is the one true optional in the stack — the
          capture form above it works completely without it. */}
      <div className="mt-4 hidden border-t border-border pt-3 text-left text-xs text-muted-foreground [@media(min-height:700px)]:block">
        <p className="font-semibold text-foreground">What happens next</p>
        <p className="mt-1.5">
          You&apos;ll get one email with a sign-in link. Open it and
          you&apos;re straight into the course — for whatever&apos;s left
          of your window above.
        </p>
      </div>
    </div>
  );
}
