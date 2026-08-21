import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

// The recruiting dashboard's form kit — ported off CreatorRoster's own
// Field/Input/Textarea/Select/Checkbox/TagPicker, restyled onto the same
// `border-2 border-ink` + `focus-visible:ring-ring/50` convention already
// used by the account page's change-password form. Deliberately does NOT
// use card-sticker/btn-sticker's hard offset shadow — that's a marketing-page
// device, kept out of daily-use screens on purpose (see globals.css).

const FIELD_BASE =
  "h-10 w-full rounded-lg border-2 border-ink bg-background px-3 text-sm outline-none " +
  "transition-colors placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"

interface FieldWrapperProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  children: React.ReactNode
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  optional,
  children,
}: FieldWrapperProps) {
  return (
    <div className="flex h-full flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        {required && (
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            Required
          </span>
        )}
        {optional && !required && (
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Optional
          </span>
        )}
      </div>

      {hint && <p className="-mt-0.5 text-sm text-muted-foreground">{hint}</p>}

      <div className="mt-auto flex flex-col gap-1.5">
        {children}
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_BASE, className)} {...props} />
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(FIELD_BASE, "h-auto min-h-24 resize-y py-2", className)}
      {...props}
    />
  )
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD_BASE, "cursor-pointer", className)} {...props} />
  )
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode
  id: string
}

export function Checkbox({ label, id, className, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className="group flex cursor-pointer items-start gap-2.5 py-1">
      <input
        id={id}
        type="checkbox"
        className={cn(
          "mt-0.5 size-4 shrink-0 cursor-pointer rounded border-2 border-ink accent-primary transition-colors",
          className
        )}
        {...props}
      />
      <span className="text-sm leading-relaxed text-foreground">{label}</span>
    </label>
  )
}

/** Multi-select chips for fixed vocabularies (languages, content types). */
export function TagPicker({
  options,
  selected,
  onToggle,
  columns = false,
}: {
  options: readonly string[]
  selected: string[]
  onToggle: (value: string) => void
  columns?: boolean
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", columns && "max-h-64 overflow-y-auto")}>
      {options.map((option) => {
        const active = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            aria-pressed={active}
            className={cn(
              "min-h-9 cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-ink bg-primary text-primary-foreground"
                : "border-ink bg-background text-foreground hover:bg-muted"
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
