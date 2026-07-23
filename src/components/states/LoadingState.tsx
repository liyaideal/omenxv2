import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: string;
  variant?: "spinner" | "skeleton";
  /** Number of skeleton rows to render when `variant="skeleton"`. */
  skeletonRows?: number;
  className?: string;
}

/**
 * Canonical loading state (DESIGN.md §State Patterns).
 *
 * `spinner` — compact inline row with Lucide Loader2 + label.
 * `skeleton` — N shimmering placeholder rows for list/table loads.
 */
export const LoadingState = ({
  label = "Loading…",
  variant = "spinner",
  skeletonRows = 3,
  className,
}: LoadingStateProps) => {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-2", className)} aria-busy="true" aria-label={label}>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-muted/20 motion-safe:animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="w-4 h-4 motion-safe:animate-spin" />
      <span>{label}</span>
    </div>
  );
};

export default LoadingState;
