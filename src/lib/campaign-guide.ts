/**
 * The long parts of a campaign's brief, as the admin types them: a product guide (what the product is and does, read
 * before a creator even tries it) and the scripts (one per format, each with its example video). Plain text with a
 * few marks, so it can be pasted from a doc:
 *
 *   ## Heading            a section heading
 *   ### Title             a script (in the scripts) or a small heading (in the guide)
 *   ! Never say X         a warning, shown in red (and the guide's warnings also show on the campaign page)
 *   - item  /  1. item    a list
 *   Example: https://…    an example video link (anything after the link is its note)
 *   **bold**              bold, inside any line
 *
 * Everything else is a paragraph; a blank line ends one. Pure, so the page and the tests share it.
 */

export const MAX_GUIDE_LENGTH = 20_000;

export type GuideInline = { text: string; bold: boolean }[];

export type GuideBlock =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "warning"; text: GuideInline }
  | { kind: "list"; ordered: boolean; items: GuideInline[] }
  | { kind: "paragraph"; text: GuideInline }
  | { kind: "example"; url: string; note: string };

/** `**bold**` runs inside one line. An unclosed `**` stays as typed. */
export function parseInline(line: string): GuideInline {
  const out: GuideInline = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  for (let m = re.exec(line); m; m = re.exec(line)) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last), bold: false });
  return out;
}

const EXAMPLE = /^examples?\s*:\s*(https:\/\/\S+)\s*(.*)$/i;

export function parseGuide(raw: string): GuideBlock[] {
  const blocks: GuideBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "paragraph", text: parseInline(para.join(" ")) });
    para = [];
  };
  const addItem = (ordered: boolean, text: string) => {
    const prev = blocks.at(-1);
    if (prev?.kind === "list" && prev.ordered === ordered) prev.items.push(parseInline(text));
    else blocks.push({ kind: "list", ordered, items: [parseInline(text)] });
  };

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    const example = EXAMPLE.exec(line);
    const bullet = /^[-*•]\s+(.+)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ kind: "heading", level: heading[1].length as 2 | 3, text: heading[2].replace(/\*\*/g, "") });
    } else if (line.startsWith("!")) {
      flush();
      const text = line.replace(/^!+\s*/, "");
      if (text) blocks.push({ kind: "warning", text: parseInline(text) });
    } else if (example) {
      flush();
      blocks.push({ kind: "example", url: example[1], note: example[2].replace(/^[\s—–:-]+/, "") });
    } else if (bullet) {
      flush();
      addItem(false, bullet[1]);
    } else if (numbered) {
      flush();
      addItem(true, numbered[1]);
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}

export type Script = { title: string; examples: { url: string; note: string }[]; body: GuideBlock[] };

/**
 * The scripts: each `###` line starts one, and its example links are pulled out to sit beside the title. Anything
 * before the first script (a note for every script) is returned as `intro`.
 */
export function parseScripts(raw: string): { intro: GuideBlock[]; scripts: Script[] } {
  const intro: GuideBlock[] = [];
  const scripts: Script[] = [];
  for (const block of parseGuide(raw)) {
    const current = scripts.at(-1);
    if (block.kind === "heading" && block.level === 3) scripts.push({ title: block.text, examples: [], body: [] });
    else if (!current) intro.push(block);
    else if (block.kind === "example") current.examples.push({ url: block.url, note: block.note });
    else current.body.push(block);
  }
  return { intro, scripts };
}

/** The guide's warnings, shown on the campaign page itself so nobody misses them. */
export function guideWarnings(blocks: GuideBlock[]): GuideInline[] {
  return blocks.flatMap((b) => (b.kind === "warning" ? [b.text] : []));
}

/** Plain text of one line, for keys and labels. */
export function inlineText(text: GuideInline): string {
  return text.map((t) => t.text).join("");
}
