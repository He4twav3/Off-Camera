import "server-only";

import { statSync } from "node:fs";
import { join } from "node:path";

/**
 * A file's own last-modified time, as a `?v=` cache-busting query value.
 *
 * For video specifically: these files get replaced in place at the same
 * public path more than once over a project's life (a re-encode, a swap
 * for a better cut), and a browser that already fetched the old bytes at
 * that exact URL has no reliable reason to ask again — `Cache-Control:
 * must-revalidate` is a request to check, not a guarantee every client
 * honors it, and mobile Safari's media cache in particular is known to
 * hang onto video byte-ranges past what the header says. Tying the
 * version to the file's own mtime means the URL — and so the cache key —
 * changes automatically the next time the file actually changes, with no
 * manual bump to remember.
 *
 * Never throws: a file that can't be stat'd (moved, permissions) just
 * gets no version suffix, which is the plain unversioned behavior, not a
 * broken video.
 */
export function videoVersion(publicPath: string): number | "" {
  try {
    return statSync(join(process.cwd(), "public", publicPath)).mtimeMs;
  } catch {
    return "";
  }
}
