"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { normaliseHandle, PLATFORM_RULES } from "@/lib/handles";
import type { PlatformEnum } from "@/lib/database.types";

export interface HandleDraft {
  key: string;
  platform: PlatformEnum;
  handle: string;
  follower_count: string;
}

const PLATFORMS: PlatformEnum[] = [
  "tiktok",
  "instagram",
  "youtube_shorts",
  "x",
];

interface HandlesFieldProps {
  value: HandleDraft[];
  onChange: (next: HandleDraft[]) => void;
}

/**
 * Repeater for the creator's accounts. The first row is their main platform,
 * which is what campaign matching uses.
 *
 * Handle validation runs live so a pasted profile URL becomes a clean handle in
 * front of them rather than failing on submit. The server re-validates the same
 * way — this is convenience, not the enforcement.
 */
export function HandlesField({ value, onChange }: HandlesFieldProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function update(key: string, patch: Partial<HandleDraft>) {
    onChange(value.map((h) => (h.key === key ? { ...h, ...patch } : h)));
  }

  function add() {
    const used = new Set(value.map((h) => h.platform));
    const next = PLATFORMS.find((p) => !used.has(p)) ?? "tiktok";
    onChange([
      ...value,
      {
        key: crypto.randomUUID(),
        platform: next,
        handle: "",
        follower_count: "",
      },
    ]);
  }

  function remove(key: string) {
    onChange(value.filter((h) => h.key !== key));
  }

  return (
    <div className="flex flex-col gap-5">
      {value.map((row, i) => {
        const rule = PLATFORM_RULES[row.platform];
        const result = row.handle
          ? normaliseHandle(row.handle, row.platform)
          : null;
        const showError = touched[row.key] && result && !result.ok;

        return (
          <div
            key={row.key}
            className="flex flex-col gap-4 rounded-md border border-border bg-muted/50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-heading text-[15px] font-semibold text-foreground">
                {i === 0 ? "Main account" : `Account ${i + 1}`}
              </p>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => remove(row.key)}
                  aria-label={`Remove account ${i + 1}`}
                  className="flex min-h-11 cursor-pointer items-center gap-1 px-2 text-sm font-semibold text-destructive transition-opacity duration-200 hover:opacity-80"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              )}
            </div>

            {/* Platform + handle are the two that matter, so they lead. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Platform" htmlFor={`platform-${row.key}`} required>
                <Select
                  id={`platform-${row.key}`}
                  value={row.platform}
                  onChange={(e) =>
                    update(row.key, {
                      platform: e.target.value as PlatformEnum,
                    })
                  }
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_RULES[p].label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Handle"
                htmlFor={`handle-${row.key}`}
                required
                error={showError ? result!.error : undefined}
              >
                <Input
                  id={`handle-${row.key}`}
                  value={row.handle}
                  onChange={(e) => update(row.key, { handle: e.target.value })}
                  onBlur={() => {
                    setTouched((t) => ({ ...t, [row.key]: true }));
                    // Clean it in place so they see exactly what gets stored.
                    const r = normaliseHandle(row.handle, row.platform);
                    if (r.ok && r.handle !== row.handle) {
                      update(row.key, { handle: r.handle });
                    }
                  }}
                  placeholder="yourhandle"
                  aria-invalid={showError ? true : undefined}
                />
              </Field>
            </div>

            <p className="-mt-1 text-sm text-muted-foreground">
              {rule.rule} You can paste your profile link and we&apos;ll pull
              the handle out of it.
            </p>

            {result?.ok && (
              <a
                href={result.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="-mt-2 text-sm font-semibold text-primary underline underline-offset-2 break-all"
              >
                Check it opens: {result.profileUrl}
              </a>
            )}

            <div className="border-t border-border pt-4">
              <Field
                label="Followers"
                htmlFor={`followers-${row.key}`}
                optional
                hint="Roughly is fine. We check the real number on your profile before assigning work."
              >
                <Input
                  id={`followers-${row.key}`}
                  type="number"
                  min={0}
                  max={1_000_000_000}
                  inputMode="numeric"
                  value={row.follower_count}
                  onChange={(e) =>
                    update(row.key, { follower_count: e.target.value })
                  }
                  placeholder="12000"
                  className="sm:max-w-56"
                />
              </Field>
            </div>
          </div>
        );
      })}

      {value.length < PLATFORMS.length && (
        <div className="self-start">
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus size={18} />
            Add another platform
          </Button>
        </div>
      )}
    </div>
  );
}
