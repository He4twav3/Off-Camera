"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SEARCH_INDEX, type SearchEntry } from "@/lib/search-index";
import { cn } from "@/lib/utils";

function matches(entry: SearchEntry, query: string) {
  const q = query.toLowerCase();
  return (
    entry.title.toLowerCase().includes(q) ||
    entry.description?.toLowerCase().includes(q)
  );
}

/**
 * Real site search: Cmd/Ctrl+K anywhere, or the search bar in the navbar.
 * Queries an actual index of every page, section, and curriculum
 * module/lesson (see search-index.ts) — not scoped to just the curriculum
 * accordion the way the old navbar search form was.
 *
 * `variant` picks the trigger's appearance (the desktop pill-shaped search
 * bar vs. a plain row inside the mobile sheet); each mounted instance owns
 * its own dialog, which is fine since at most one is visible at a time.
 */
export function SiteSearch({ variant = "bar" }: { variant?: "bar" | "row" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function openDialog() {
    setQuery("");
    setOpen(true);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) setQuery("");
          return !o;
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Base UI moves focus into the dialog on open; grab the input right after.
  // (Pure side effect reacting to `open` — no setState here, so this one's
  // exempt from the "no setState in effects" rule above.)
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim();
    const pool = q ? SEARCH_INDEX.filter((e) => matches(e, q)) : SEARCH_INDEX.slice(0, 8);
    const grouped = new Map<string, SearchEntry[]>();
    for (const entry of pool.slice(0, 40)) {
      grouped.set(entry.group, [...(grouped.get(entry.group) ?? []), entry]);
    }
    return grouped;
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {variant === "bar" ? (
        <button
          type="button"
          onClick={openDialog}
          className="relative hidden max-w-xs flex-1 items-center md:flex"
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <span className="h-9 w-full rounded-full border-2 border-ink bg-card pr-3 pl-9 text-left text-sm leading-9 text-muted-foreground">
            Search the site…
          </span>
          <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      ) : (
        <button
          type="button"
          onClick={openDialog}
          className="pill-outline flex items-center gap-2.5 rounded-full bg-card px-3.5 py-2 text-left text-sm font-semibold transition-colors hover:bg-accent"
        >
          <Search className="size-4" />
          Search the site…
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[18%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">Search Off Camera</DialogTitle>
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, curriculum, lessons…"
              className="h-6 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close search"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {results.size === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;.
              </p>
            ) : (
              [...results.entries()].map(([group, entries]) => (
                <div key={group} className="mb-2 last:mb-0">
                  <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    {group}
                  </p>
                  {entries.map((entry) => (
                    <button
                      key={entry.href + entry.title}
                      type="button"
                      onClick={() => go(entry.href)}
                      className={cn(
                        "flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"
                      )}
                    >
                      <span className="font-medium">{entry.title}</span>
                      {entry.description && (
                        <span className="text-xs text-muted-foreground">
                          {entry.description}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
