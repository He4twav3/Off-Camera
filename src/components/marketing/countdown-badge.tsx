"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "off-camera-launch-window-start";
const WINDOW_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

/**
 * Per-visitor, not shared — starts the first time THIS browser loads
 * the page, persisted in localStorage so leaving and coming back
 * doesn't reset it. Deliberately not a shared "everyone's deadline is
 * X" countdown and not a headcount: it's a real, honest mechanic (your
 * own personal 5-day window from your own first visit), not a claim
 * about other people or a number nobody can verify.
 */
function readOrStartWindow(): number {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      const parsed = Number(existing);
      if (Number.isFinite(parsed)) return parsed;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall through
    // to an in-memory start; the countdown still works for this visit,
    // it just won't survive a reload.
  }
  const start = Date.now();
  try {
    window.localStorage.setItem(STORAGE_KEY, String(start));
  } catch {
    // ignore, see above
  }
  return start;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * One digit cell.
 *
 * Bare numerals — no plate, no box, no border. Boxing each digit turned
 * the countdown into four separate widgets fighting the headline above
 * it for attention; without them the numbers themselves carry it, which
 * is what should have been carrying it all along.
 *
 * Set in the mono face rather than the heading face on purpose. A
 * counter is instrumentation, and instrumentation is monospaced — it
 * reads as a real measurement rather than as a marketing number. That's
 * also what keeps the urgency from feeling like pressure: it's stating a
 * fact about a window, not shouting at anyone.
 *
 * `tabular-nums` is not optional here — without it the whole row visibly
 * twitches once a second as glyph widths change underneath it.
 */
function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-lit font-mono text-[2.75rem] leading-none font-semibold tracking-[-0.02em] tabular-nums sm:text-[3.5rem]">
        {value}
      </span>
      <span className="text-[0.6rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase sm:text-[0.65rem]">
        {label}
      </span>
    </div>
  );
}

/** The gap between numerals. Dim, and aligned to the numerals rather
 * than to the whole column — the label row underneath is reserved with
 * an invisible spacer so the two stay locked as the layout reflows. */
function Sep() {
  return (
    <div className="flex flex-col items-center gap-2" aria-hidden>
      <span className="font-mono text-[2.75rem] leading-none font-light text-muted-foreground/35 sm:text-[3.5rem]">
        :
      </span>
      <span className="text-[0.6rem] opacity-0 select-none sm:text-[0.65rem]">&nbsp;</span>
    </div>
  );
}

/**
 * The hero's centrepiece: a real, per-visitor 5-day window, rendered as
 * a physical count-down panel rather than as a marketing badge (see
 * Unit above for why that framing matters, and readOrStartWindow for
 * why the mechanic itself is honest — it is this browser's own window,
 * not a fake shared deadline and not a headcount).
 */
export function CountdownBadge() {
  // null = not yet computed (server render + the instant before the
  // effect below runs on the client) — both render this exact same
  // "not yet known" state, so there's nothing for hydration to disagree
  // about; the real countdown only appears after that first effect run.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = readOrStartWindow() + WINDOW_MS;
    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = remaining === null ? null : formatRemaining(remaining);

  return (
    <div className="mx-auto flex flex-col items-center gap-5">
      {/* Live indicator: a dot with an expanding ring behind it, the same
          "something is genuinely running" signal as the viewfinder's REC
          mark — and in the same red, since that is what a tally light
          actually is. Pulsing a solid dot reads as decoration; a ping
          reads as transmission. */}
      <span className="inline-flex items-center gap-2.5 font-mono text-[0.7rem] font-semibold tracking-[0.16em] text-signal uppercase">
        <span className="relative flex size-1.5 shrink-0">
          {time && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-crimson-bright/60 motion-reduce:animate-none" />
          )}
          <span className="relative inline-flex size-1.5 rounded-full bg-crimson-bright" />
        </span>
        {time ? "Your free preview window" : "Free preview · your 5-day window starts now"}
      </span>

      {time ? (
        <div className="flex items-start gap-3 sm:gap-5">
          <Unit value={String(time.days)} label={time.days === 1 ? "Day" : "Days"} />
          <Sep />
          <Unit value={String(time.hours).padStart(2, "0")} label="Hours" />
          <Sep />
          <Unit value={String(time.minutes).padStart(2, "0")} label="Min" />
          <Sep />
          <Unit value={String(time.seconds).padStart(2, "0")} label="Sec" />
        </div>
      ) : remaining !== null ? (
        // remaining is a real, non-null number but formatRemaining
        // returned null — the window has actually run out.
        <p className="text-sm font-semibold text-muted-foreground">
          Your free preview window has closed.
        </p>
      ) : (
        // Pre-hydration placeholder — same 4-unit shape at 00:00:00:00
        // so nothing jumps in size once the real numbers arrive.
        <div className="flex items-start gap-3 opacity-0 sm:gap-5" aria-hidden="true">
          <Unit value="5" label="Days" />
          <Sep />
          <Unit value="00" label="Hours" />
          <Sep />
          <Unit value="00" label="Min" />
          <Sep />
          <Unit value="00" label="Sec" />
        </div>
      )}
    </div>
  );
}
