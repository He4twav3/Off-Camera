import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  current: number; // 1-indexed
  total: number;
  className?: string;
}

// Required on every multi-step flow (signup, OTP, profile wizard) per the
// Feedback/Progress-Indicators UX guideline.
export function StepIndicator({
  current,
  total,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-sm font-semibold text-muted-foreground">
        Step {current} of {total}
      </p>
      <div
        className="flex gap-2"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${current} of ${total}`}
      >
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-200",
              i < current ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}
