"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { BookOpen, Check, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GuideText, ScriptList } from "@/components/app/GuideText";
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
        {/* The brief reads like a document: black text on a white page. */}
        <SheetContent
          initialFocus={top}
          className="gap-0 overflow-y-auto bg-neutral-200 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl [&_[data-slot=sheet-close]]:text-neutral-900 [&_[data-slot=sheet-close]]:hover:bg-neutral-200"
        >
          <div ref={top} tabIndex={-1} className="mx-auto w-full max-w-[52rem] bg-white px-6 py-10 text-[15px] leading-relaxed text-neutral-900 outline-none sm:px-12 sm:py-14">
            <SheetHeader className="p-0 pr-10">
              <SheetTitle className="text-2xl font-bold text-neutral-900">{campaign} brief</SheetTitle>
              <SheetDescription className="text-neutral-600">Everything the brand needs in your videos.</SheetDescription>
            </SheetHeader>

            {guide.length > 0 && (
              <DocSection title="Know the product" note="Read this before you try it.">
                <GuideText blocks={guide} />
              </DocSection>
            )}
            {scripts.length > 0 && (
              <DocSection title="Scripts" note="Watch the example, then make the format your own.">
                {scriptsIntro.length > 0 && (
                  <div className="mb-5">
                    <GuideText blocks={scriptsIntro} />
                  </div>
                )}
                <ScriptList scripts={scripts} />
              </DocSection>
            )}
            {rules.length > 0 && (
              <DocSection title="The rules" note="Follow them in every video.">
                <ol className="list-decimal space-y-1 pl-6">
                  {rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ol>
              </DocSection>
            )}
            {requirements.length > 0 && (
              <DocSection title="Requirements">
                <ul className="list-disc space-y-1 pl-6">
                  {requirements.map((r) => (
                    <li key={r.label}>
                      <strong className="font-bold">{r.label}:</strong> {r.value}
                    </li>
                  ))}
                </ul>
              </DocSection>
            )}
            {formats.length > 0 && scripts.length === 0 && (
              <DocSection title="Formats that work">
                <ul className="list-disc space-y-1 pl-6">
                  {formats.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </DocSection>
            )}
            {payLines.length > 0 && (
              <DocSection title="How it pays">
                <ul className="list-disc space-y-1 pl-6">
                  {payLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </DocSection>
            )}
            {about && guide.length === 0 && (
              <DocSection title="About the brand">
                <p className="whitespace-pre-line">{about}</p>
              </DocSection>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </OpenBrief.Provider>
  );
}

/** One section of the brief document: a ruled heading, an optional line under it, then the content. */
function DocSection({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h3 className="border-b border-neutral-300 pb-1.5 text-xl font-bold">{title}</h3>
      {note && <p className="mt-2 text-neutral-600 italic">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
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

/** The brief on the page: the key rules, then the formats that work. The full brief opens from the top of the page. */
export function BriefKeyRules({ rules, formats }: { rules: string[]; formats: string[] }) {
  const shown = rules.slice(0, KEY_RULES);
  return (
    <section className="mt-5 rounded-xl border border-border/70 bg-card px-4 py-3 sm:mt-8 sm:px-5 sm:py-4">
      <h2 className="font-heading text-base font-semibold text-foreground">The brief</h2>
      {shown.length > 0 && (
        <>
          <h3 className="mt-4 text-sm font-semibold text-muted-foreground">Key rules</h3>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {shown.map((rule) => (
              <li key={rule} className="flex items-start gap-3 text-[15px] text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {rule}
              </li>
            ))}
          </ul>
        </>
      )}
      {formats.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold text-muted-foreground">Formats that work</h3>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {formats.map((f) => (
              <li key={f} className="flex items-start gap-3 text-[15px] text-foreground">
                <Video className="mt-0.5 size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
