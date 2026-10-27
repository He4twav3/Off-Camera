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
            className="mx-auto w-full max-w-[52rem] bg-black px-5 py-8 text-[15px] leading-relaxed text-neutral-200 outline-none sm:px-12 sm:py-14"
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
                tone="product"
                title="Know the product"
                note="Read this before you try it."
              >
                <GuideText blocks={guide} />
              </DocSection>
            )}
            {requirements.length > 0 && (
              <DocSection
                tone="make"
                title={guide.length > 0 ? "What to make" : "Requirements"}
              >
                <dl className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-950">
                  {requirements.map((r) => (
                    <div key={r.label} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-4">
                      <dt className="shrink-0 text-xs font-semibold tracking-wide text-amber-300 uppercase sm:w-28 sm:pt-0.5">
                        {r.label}
                      </dt>
                      <dd className="font-medium text-white">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </DocSection>
            )}
            {/* Any "## " part of the scripts' intro (such as which account to use) is its own section, right above the scripts. */}
            {scriptsParts.sections.map((part) => (
              <DocSection key={part.title} tone="make" title={part.title} card>
                <GuideText blocks={part.blocks} />
              </DocSection>
            ))}
            {scripts.length > 0 && (
              <DocSection
                tone="scripts"
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
              <DocSection tone="pay" title="How it pays" card>
                <ul className="flex flex-col gap-2.5">
                  {payLines.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                      <span>
                        <Figures text={line} />
                      </span>
                    </li>
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

/**
 * The colour each kind of section is marked with: the product blue, what to make and which account amber, the
 * scripts violet, the pay green. Only the marker, the label and key figures take the colour; body text stays neutral.
 */
const TONES = {
  product: { bar: "bg-sky-400", label: "text-sky-300", card: "" },
  make: { bar: "bg-amber-400", label: "text-amber-300", card: "border-amber-400/25 bg-amber-400/[0.06]" },
  scripts: { bar: "bg-violet-400", label: "text-violet-300", card: "" },
  pay: { bar: "bg-emerald-400", label: "text-emerald-300", card: "border-emerald-400/25 bg-emerald-400/[0.06]" },
  plain: { bar: "bg-neutral-500", label: "text-neutral-400", card: "" },
} as const;

/**
 * One section of the brief document: a heading with its colour marker, an optional line under it, then the content,
 * set in a lightly tinted card when the section is one a creator must not miss.
 */
function DocSection({
  title,
  note,
  tone = "plain",
  card = false,
  children,
}: {
  title: string;
  note?: string;
  tone?: keyof typeof TONES;
  card?: boolean;
  children: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <section className="mt-10 sm:mt-12">
      <div className="flex items-center gap-3">
        <span aria-hidden className={`h-6 w-1 shrink-0 rounded-full ${t.bar}`} />
        <h3 className="text-xl font-bold text-white sm:text-2xl">{title}</h3>
      </div>
      {note && <p className={`mt-2 text-sm ${t.label}`}>{note}</p>}
      <div className={card ? `mt-4 rounded-xl border p-4 sm:p-5 ${t.card}` : "mt-4"}>{children}</div>
    </section>
  );
}

/** A pay line with its dollar amounts and view counts picked out, so the numbers read first. */
function Figures({ text }: { text: string }) {
  const parts = text.split(/(\$[\d,]+(?:\.\d+)?|\b\d[\d,.]*[KM]?\s(?:views|days)\b)/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-emerald-300">
            {p}
          </strong>
        ) : (
          p
        ),
      )}
    </>
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
