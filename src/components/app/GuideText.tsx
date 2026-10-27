import { ChevronDown, PlayCircle, TriangleAlert } from "lucide-react";
import type { GuideBlock, GuideInline, Script } from "@/lib/campaign-guide";

/** One line with its bold runs. */
function Inline({ text }: { text: GuideInline }) {
  return (
    <>
      {text.map((t, i) =>
        t.bold ? (
          <strong key={i} className="font-semibold text-foreground">
            {t.text}
          </strong>
        ) : (
          t.text
        ),
      )}
    </>
  );
}

/** A warning, in red: the one thing a creator must not get wrong. */
export function GuideWarning({ text }: { text: GuideInline }) {
  return (
    <p className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-[15px] font-semibold text-destructive">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <span>
        <Inline text={text} />
      </span>
    </p>
  );
}

function ExampleLink({ url, note }: { url: string; note: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1 text-sm font-medium text-foreground hover:border-primary/60 hover:text-primary"
    >
      <PlayCircle className="size-4 shrink-0 text-primary" />
      <span className="truncate">Watch the example{note ? `: ${note}` : ""}</span>
    </a>
  );
}

/** The product guide, or the notes inside a script, as the admin wrote them. */
export function GuideText({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-muted-foreground">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "heading":
            return b.level === 2 ? (
              <h4 key={i} className="mt-2 font-heading text-base font-semibold text-foreground">
                {b.text}
              </h4>
            ) : (
              <h5 key={i} className="mt-1 text-[15px] font-semibold text-foreground">
                {b.text}
              </h5>
            );
          case "warning":
            return <GuideWarning key={i} text={b.text} />;
          case "list": {
            const List = b.ordered ? "ol" : "ul";
            return (
              <List key={i} className={`${b.ordered ? "list-decimal" : "list-disc"} space-y-1.5 pl-5`}>
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "example":
            return (
              <div key={i}>
                <ExampleLink url={b.url} note={b.note} />
              </div>
            );
          default:
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}

/**
 * The scripts, one card each: the title and its example videos always showing, the script itself one tap away, so
 * five scripts never become one wall of text.
 */
export function ScriptCards({ scripts }: { scripts: Script[] }) {
  return (
    <div className="flex flex-col gap-3">
      {scripts.map((s, i) => (
        <div key={`${i}-${s.title}`} className="rounded-xl border border-border/70 bg-card px-4 py-3">
          <h4 className="font-heading text-[15px] font-semibold text-foreground">{s.title}</h4>
          {s.examples.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {s.examples.map((e) => (
                <ExampleLink key={e.url} url={e.url} note={e.note} />
              ))}
            </div>
          )}
          {s.body.length > 0 && (
            <details className="group mt-3">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-medium text-primary [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Show the script</span>
                <span className="hidden group-open:inline">Hide the script</span>
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 border-t border-border/70 pt-3">
                <GuideText blocks={s.body} />
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
