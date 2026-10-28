"use client"

import { Select as SelectPrimitive } from "@base-ui/react/select"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A dropdown drawn by the site, in the form's own size, instead of the browser's system list (which on a Mac
 * can open in huge type). Sends `name` with the form like a <select>.
 */
export function Choice({
  id,
  name,
  value,
  onValueChange,
  options,
  placeholder = "Choose…",
  className,
}: {
  id?: string
  name: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}) {
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]))
  return (
    <SelectPrimitive.Root
      id={id}
      name={name}
      items={items}
      value={value || null}
      onValueChange={(v) => onValueChange(typeof v === "string" ? v : "")}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={<span className="text-muted-foreground">{placeholder}</span>} className="truncate" />
        <SelectPrimitive.Icon>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner className="isolate z-50 outline-none" sideOffset={4} alignItemWithTrigger={false}>
          <SelectPrimitive.Popup className="max-h-[min(20rem,var(--available-height))] w-(--anchor-width) overflow-y-auto rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
              >
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <CheckIcon className="size-4" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
