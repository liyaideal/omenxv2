import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Canonical error state (DESIGN.md §State Patterns).
 *
 * Uses the destructive semantic token — never hardcoded reds. Only renders the
 * Retry button when an `onRetry` handler is provided.
 */
export const ErrorState = ({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
  retryLabel = "Retry",
  className,
}: ErrorStateProps) => {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/[0.04] px-6 py-8 flex flex-col items-center text-center",
        className,
      )}
    >
      <AlertTriangle className="w-8 h-8 text-destructive/70" />
      <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5"
          onClick={onRetry}
        >
          <RotateCw className="w-3.5 h-3.5" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
