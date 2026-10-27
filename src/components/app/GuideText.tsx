import type { GuideBlock, GuideInline, Script } from "@/lib/campaign-guide";

/*
 * The product guide and scripts, set like a printed document (black on a white page): the full brief reads as a
 * doc, not as more of the app.
 */

/** One line with its bold runs. */
function Inline({ text }: { text: GuideInline }) {
  return (
    <>
      {text.map((t, i) =>
        t.bold ? (
          <strong key={i} className="font-bold">
            {t.text}
          </strong>
        ) : (
          t.text
        ),
      )}
    </>
  );
}

/** A warning: bold red capitals, the one thing a creator must not get wrong. */
function Warning({ text }: { text: GuideInline }) {
  return (
    <p className="font-bold text-red-600 uppercase">
      <Inline text={text} />
    </p>
  );
}

/** A short name for a video link: the account and the site, e.g. "@dawn_flaherty on TikTok". */
function linkLabel(url: string): string {
  try {
    const u = new URL(url);
    const site = u.hostname.replace(/^www\./, "");
    const name = site.startsWith("tiktok.") ? "TikTok" : site.startsWith("instagram.") ? "Instagram" : /youtu/.test(site) ? "YouTube" : site;
    const handle = u.pathname.split("/").find((p) => p.startsWith("@"));
    return handle ? `${handle} on ${name}` : name === site ? site : `Watch on ${name}`;
  } catch {
    return url;
  }
}

function ExampleLink({ url, note }: { url: string; note: string }) {
  return (
    <p>
      <span className="font-bold">Example{note ? `, ${note}` : ""}:</span>{" "}
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
        {linkLabel(url)}
      </a>
    </p>
  );
}

/** The product guide, or the notes inside a script, as the admin wrote them. */
export function GuideText({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "heading":
            return b.level === 2 ? (
              <h4 key={i} className="mt-3 text-lg font-bold">
                {b.text}
              </h4>
            ) : (
              <h5 key={i} className="mt-2 font-bold">
                {b.text}
              </h5>
            );
          case "warning":
            return <Warning key={i} text={b.text} />;
          case "list": {
            const List = b.ordered ? "ol" : "ul";
            return (
              <List key={i} className={`${b.ordered ? "list-decimal" : "list-disc"} space-y-1 pl-6`}>
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "example":
            return <ExampleLink key={i} url={b.url} note={b.note} />;
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

/** The scripts, one after another like sections of a doc: title, example links, then the script. */
export function ScriptList({ scripts }: { scripts: Script[] }) {
  return (
    <div className="flex flex-col gap-6">
      {scripts.map((s, i) => (
        <section key={`${i}-${s.title}`} className="flex flex-col gap-2">
          <h4 className="text-lg font-bold">{s.title}</h4>
          {s.examples.map((e) => (
            <ExampleLink key={e.url} url={e.url} note={e.note} />
          ))}
          {s.body.length > 0 && <GuideText blocks={s.body} />}
        </section>
      ))}
    </div>
  );
}
