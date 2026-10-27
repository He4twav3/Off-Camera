"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BookOpen, MessageSquareQuote, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GuideText, ScriptList } from "@/components/app/GuideText";
import { parseBrief, type GuideBlock, type Script } from "@/lib/campaign-guide";

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
  // The scripts' intro, split into its plain lines and any "## " sections (see the Scripts section below).
  const scriptsParts = splitSections(scriptsIntro);
  // Open at the top, on the title: focusing the first button would scroll past the guide to the scripts.
  const top = useRef<HTMLDivElement>(null);
  return (
    <OpenBrief.Provider value={() => setOpen(true)}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        {/* The brief reads like a document: white text on a black page. */}
        <SheetContent
          initialFocus={top}
          className="gap-0 overflow-y-auto bg-black data-[side=right]:w-full data-[side=right]:sm:max-w-3xl [&_[data-slot=sheet-close]]:text-white [&_[data-slot=sheet-close]]:hover:bg-neutral-800"
        >
          <div
            ref={top}
            tabIndex={-1}
            className="mx-auto w-full max-w-[52rem] bg-black px-6 py-10 text-[15px] leading-relaxed text-white outline-none sm:px-12 sm:py-14"
          >
            <SheetHeader className="p-0 pr-10">
              <SheetTitle className="text-2xl font-bold text-white">
                {campaign} brief
              </SheetTitle>
              <SheetDescription className="text-neutral-400">
                Everything the brand needs in your videos.
              </SheetDescription>
            </SheetHeader>

            {/* In order: the product, what to make, how to make it, then how it pays, always last. */}
            {guide.length > 0 && (
              <DocSection
                title="Know the product"
                note="Read this before you try it."
              >
                <GuideText blocks={guide} />
              </DocSection>
            )}
            {requirements.length > 0 && (
              <DocSection
                title={guide.length > 0 ? "What to make" : "Requirements"}
              >
                <ul className="list-disc space-y-1 pl-6">
                  {requirements.map((r) => (
                    <li key={r.label}>
                      <strong className="font-bold">{r.label}:</strong>{" "}
                      {r.value}
                    </li>
                  ))}
                </ul>
              </DocSection>
            )}
            {/* Any "## " part of the scripts' intro (such as which account to use) is its own section, right above the scripts. */}
            {scriptsParts.sections.map((part) => (
              <DocSection key={part.title} title={part.title}>
                <GuideText blocks={part.blocks} />
              </DocSection>
            ))}
            {scripts.length > 0 && (
              <DocSection
                title="Scripts"
                note="Watch the example videos on the campaign page, then make the format your own."
              >
                {scriptsParts.intro.length > 0 && (
                  <div className="mb-5">
                    <GuideText blocks={scriptsParts.intro} />
                  </div>
                )}
                <ScriptList scripts={scripts} />
              </DocSection>
            )}
            {rules.length > 0 && guide.length === 0 && (
              <DocSection title="The rules" note="Follow them in every video.">
                <ol className="list-decimal space-y-1 pl-6">
                  {rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ol>
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
            {about && guide.length === 0 && (
              <DocSection title="About the brand">
                <p className="whitespace-pre-line">{about}</p>
              </DocSection>
            )}
            {payLines.length > 0 && (
              <DocSection title="How it pays">
                <ul className="list-disc space-y-1.5 pl-6">
                  {payLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </DocSection>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </OpenBrief.Provider>
  );
}

/** Blocks before the first level-2 heading, then each level-2 heading with the blocks under it. */
function splitSections(blocks: GuideBlock[]): { intro: GuideBlock[]; sections: { title: string; blocks: GuideBlock[] }[] } {
  const intro: GuideBlock[] = [];
  const sections: { title: string; blocks: GuideBlock[] }[] = [];
  for (const b of blocks) {
    if (b.kind === "heading" && b.level === 2) sections.push({ title: b.text, blocks: [] });
    else if (sections.length) sections.at(-1)!.blocks.push(b);
    else intro.push(b);
  }
  return { intro, sections };
}

/** One section of the brief document: a ruled heading, an optional line under it, then the content. */
function DocSection({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <h3 className="border-b border-neutral-700 pb-1.5 text-xl font-bold">
        {title}
      </h3>
      {note && <p className="mt-2 text-neutral-400 italic">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Opens the full brief. */
export function BriefButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "outline" | "default";
}) {
  const open = useContext(OpenBrief);
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={open}
    >
      <BookOpen className="size-4" />
      Read the full brief
    </Button>
  );
}

/**
 * The brief on the page: numbered steps (or plain sentences, one per line), and under it, each in its own box, the
 * short lists the brief carries, such as the formats that work and the hooks to use.
 */
export function BriefKeyRules({ description }: { description: string }) {
  const { steps, lists } = parseBrief(description);
  const lines = description
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*\u2022]+/, "").trim())
    .filter(Boolean);
  return (
    <>
      <section className="mt-4 rounded-xl border border-border/70 bg-card px-4 py-3 sm:mt-6 sm:px-5 sm:py-4">
        <h2 className="font-heading text-base font-semibold text-foreground">
          The brief
        </h2>
        {steps.length > 0 ? (
          <ol className="mt-3 flex flex-col gap-4">
            {steps.map((step, i) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground">
                    {step.title}
                  </p>
                  {step.text && (
                    <p className="mt-0.5 text-[15px] leading-relaxed text-muted-foreground">
                      {step.text}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        {steps.length === 0 && lists.length === 0 ? (
          <div className="mt-2 flex flex-col gap-2 text-[15px] leading-relaxed text-foreground">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
      </section>
      {lists.map((list) => {
        const Icon = /hook/i.test(list.title) ? MessageSquareQuote : Video;
        return (
          <section
            key={list.title}
            className="mt-4 rounded-xl border border-border/70 bg-card px-4 py-3 sm:mt-6 sm:px-5 sm:py-4"
          >
            <h2 className="font-heading text-base font-semibold text-foreground">
              {list.title}
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-[15px] text-foreground">
              {list.items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
