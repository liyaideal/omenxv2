import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

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
  title: titleProp,
  description: descriptionProp,
  onRetry,
  retryLabel: retryLabelProp,
  className,
}: ErrorStateProps) => {
  const { t } = useT();
  const title = titleProp ?? t("common.error_title");
  const description = descriptionProp ?? t("common.please_try_again");
  const retryLabel = retryLabelProp ?? t("settings.wallet.retry");
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/[0.04] px-6 py-8 flex flex-col items-center text-center",
        className,
      )}
    >
      <img
        src="/assets/desktop/empty-error.png"
        alt=""
        aria-hidden
        className="pointer-events-none select-none w-[72px] h-auto mx-auto"
      />
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
