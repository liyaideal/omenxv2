import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

interface ActivateAirdropButtonProps {
  expiresAt: string;
  onClick: () => void;
  isActivating?: boolean;
  /** "table" = solid primary (portfolio + mobile card). "trading" = outline (desktop trading table). */
  variant?: "table" | "trading";
  className?: string;
}

export const ActivateAirdropButton = ({
  expiresAt,
  onClick,
  isActivating,
  variant = "table",
  className,
}: ActivateAirdropButtonProps) => {
  const { timeLeft, compact, isExpired, urgent } = useCountdown(expiresAt);
  if (isExpired) return null;

  const showCountdown = !isActivating && timeLeft;

  if (variant === "trading") {
    return (
      <button
        onClick={onClick}
        disabled={isActivating}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition-colors disabled:opacity-50 whitespace-nowrap",
          urgent
            ? "border-trading-red/60 text-trading-red hover:bg-trading-red/10"
            : "border-primary/50 text-primary hover:bg-primary/10",
          className,
        )}
      >
        {isActivating ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Activating…</span>
          </>
        ) : (
          <>
            <Zap className="w-3 h-3" />
            <span>Activate</span>
            {showCountdown && (
              <>
                <span className="opacity-40">·</span>
                <span className={cn("font-mono tabular-nums", urgent ? "font-semibold" : "opacity-80")}>
                  {compact}
                </span>
              </>
            )}
          </>
        )}
      </button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={isActivating}
      className={cn(
        "h-7 text-xs gap-1.5 min-w-[120px]",
        urgent
          ? "bg-trading-red text-white hover:bg-trading-red/90"
          : "btn-primary",
        className,
      )}
    >
      {isActivating ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Activating…</span>
        </>
      ) : (
        <>
          <Zap className="w-3 h-3" />
          <span>Activate</span>
          {showCountdown && (
            <>
              <span className="opacity-40">|</span>
              <span className={cn("font-mono", urgent ? "font-semibold text-white" : "text-primary-foreground/80")}>
                {timeLeft}
              </span>
            </>
          )}
        </>
      )}
    </Button>
  );
};
