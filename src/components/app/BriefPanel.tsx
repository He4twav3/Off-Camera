"use client";

import { useState } from "react";
import { BookOpen, Check, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const KEY_RULES = 5;

/**
 * The brief: the key rules on the page, and the whole brief as a document that slides open beside it — the rules,
 * the formats that work, exactly how it pays, the requirements and the brand — so nothing the creator needs is
 * hidden and nothing is repeated on the page.
 */
export function BriefPanel({
  campaign,
  rules,
  formats,
  payLines,
  requirements,
  about,
}: {
  campaign: string;
  rules: string[];
  formats: string[];
  payLines: string[];
  requirements: { label: string; value: string }[];
  about: string | null;
}) {
  const [open, setOpen] = useState(false);
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
      <Button type="button" variant="outline" className="mt-4" onClick={() => setOpen(true)}>
        <BookOpen className="size-4" />
        Read the full brief
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
          <SheetHeader className="border-b border-border/70 pr-12">
            <SheetTitle className="text-lg">{campaign} brief</SheetTitle>
            <SheetDescription>Everything the brand needs in your videos.</SheetDescription>
          </SheetHeader>
          <div className="space-y-7 px-4 pb-8 sm:px-6">
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
            {formats.length > 0 && (
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
            {about && (
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">About the brand</h3>
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">{about}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
