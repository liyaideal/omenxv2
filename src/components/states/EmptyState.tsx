import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional CTA (typically a shadcn <Button>). */
  action?: ReactNode;
  /** `card` (default) renders a dashed bordered card. `inline` is unbordered for use inside lists/panels. */
  variant?: "card" | "inline";
  className?: string;
}

/**
 * Canonical empty state (DESIGN.md §State Patterns).
 *
 * Compact by design — never occupies half a viewport. Uses Lucide icons only
 * (no emoji) and semantic muted tokens.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  variant = "card",
  className,
}: EmptyStateProps) => {
  const isCard = variant === "card";
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        isCard
          ? "rounded-lg border border-dashed border-border/50 bg-muted/10 px-6 py-8"
          : "py-10",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center",
          isCard ? "w-10 h-10 rounded-lg bg-muted/40" : "w-8 h-8",
        )}
      >
        <Icon
          className={cn(
            "text-muted-foreground",
            isCard ? "w-5 h-5" : "w-5 h-5",
          )}
        />
      </div>
      <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
