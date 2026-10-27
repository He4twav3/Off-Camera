"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { BookOpen, Check, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GuideText, ScriptCards } from "@/components/app/GuideText";
import type { GuideBlock, Script } from "@/lib/campaign-guide";

const KEY_RULES = 5;

const OpenBrief = createContext<() => void>(() => {});

/**
 * The full brief as a document that slides open beside the campaign: what the product is (read before trying it),
 * the scripts with their example videos, the rules, the formats that work, exactly how it pays, the requirements and
 * the brand. Any `BriefButton` inside opens it, so it can be reached from the top of the page and from the rules.
 */
export function BriefProvider({
  campaign,
  guide,
  scriptsIntro,
  scripts,
  rules,
  formats,
  payLines,
  requirements,
  about,
  children,
}: {
  campaign: string;
  guide: GuideBlock[];
  scriptsIntro: GuideBlock[];
  scripts: Script[];
  rules: string[];
  formats: string[];
  payLines: string[];
  requirements: { label: string; value: string }[];
  about: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Open at the top, on the title: focusing the first button would scroll past the guide to the scripts.
  const top = useRef<HTMLDivElement>(null);
  return (
    <OpenBrief.Provider value={() => setOpen(true)}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent initialFocus={top} className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
          <div ref={top} tabIndex={-1} className="outline-none">
            <SheetHeader className="border-b border-border/70 pr-12">
              <SheetTitle className="text-lg">{campaign} brief</SheetTitle>
              <SheetDescription>Everything the brand needs in your videos.</SheetDescription>
            </SheetHeader>
          </div>
          <div className="space-y-7 px-4 pb-8 sm:px-6">
            {guide.length > 0 && (
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">Know the product</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">Read this before you try it.</p>
                <div className="mt-3">
                  <GuideText blocks={guide} />
                </div>
              </div>
            )}
            {scripts.length > 0 && (
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">Scripts</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">Watch the example, then make the format your own.</p>
                {scriptsIntro.length > 0 && (
                  <div className="mt-3">
                    <GuideText blocks={scriptsIntro} />
                  </div>
                )}
                <div className="mt-3">
                  <ScriptCards scripts={scripts} />
                </div>
              </div>
            )}
            {rules.length > 0 && (
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">The rules</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">Follow them in every video.</p>
                <ol className="mt-3 flex flex-col gap-2.5">
                  {rules.map((rule, i) => (
                    <li key={rule} className="flex items-start gap-3 text-[15px] text-foreground">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      {rule}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {requirements.length > 0 && (
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">Requirements</h3>
                <dl className="mt-3 flex flex-col gap-1.5 text-sm">
                  {requirements.map((r) => (
                    <div key={r.label} className="flex flex-wrap gap-x-4">
                      <dt className="w-24 shrink-0 text-muted-foreground">{r.label}</dt>
                      <dd className="min-w-0 flex-1 font-medium text-foreground">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {formats.length > 0 && scripts.length === 0 && (
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">Formats that work</h3>
                <ul className="mt-3 flex flex-col gap-2 text-[15px] text-foreground">
                  {formats.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Video className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {payLines.length > 0 && (
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">How it pays</h3>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] text-muted-foreground">
                  {payLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {about && guide.length === 0 && (
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">About the brand</h3>
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">{about}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </OpenBrief.Provider>
  );
}

/** Opens the full brief. */
export function BriefButton({ className, variant = "outline" }: { className?: string; variant?: "outline" | "default" }) {
  const open = useContext(OpenBrief);
  return (
    <Button type="button" variant={variant} className={className} onClick={open}>
      <BookOpen className="size-4" />
      Read the full brief
    </Button>
  );
}

/** The key rules on the page, with the way into the full brief under them. */
export function BriefKeyRules({ rules }: { rules: string[] }) {
  const shown = rules.slice(0, KEY_RULES);
  return (
    <section className="mt-5 rounded-xl border border-border/70 bg-card px-4 py-3 sm:mt-8 sm:px-5 sm:py-4">
      <h2 className="font-heading text-base font-semibold text-foreground">The brief</h2>
      {shown.length > 0 && (
        <>
          <p className="mt-0.5 text-sm text-muted-foreground">The key rules. The full brief has the details.</p>
          <ul className="mt-4 flex flex-col gap-2.5">
            {shown.map((rule) => (
              <li key={rule} className="flex items-start gap-3 text-[15px] text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {rule}
              </li>
            ))}
          </ul>
        </>
      )}
      <BriefButton className="mt-4" />
    </section>
  );
}
