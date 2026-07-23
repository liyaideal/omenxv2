import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "trading-green" | "trading-red" | "trading-yellow" | "trading-purple" | "muted";

const TONE_BG: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  "trading-green": "bg-trading-green/10 text-trading-green",
  "trading-red": "bg-trading-red/10 text-trading-red",
  "trading-yellow": "bg-trading-yellow/10 text-trading-yellow",
  "trading-purple": "bg-trading-purple/10 text-trading-purple",
  muted: "bg-muted/40 text-muted-foreground",
};

interface SectionHeaderProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
}

/**
 * Compact mobile-home section header. Inline eyebrow · title on a single line.
 */
export const SectionHeader = ({
  icon: Icon,
  eyebrow,
  title,
  tone = "primary",
  actionLabel,
  onAction,
  rightSlot,
  className,
}: SectionHeaderProps) => {
  return (
    <div className={cn("mb-2 flex items-center justify-between gap-2", className)}>
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={cn(
            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded",
            TONE_BG[tone],
          )}
        >
          <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
        </span>
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="text-sm font-semibold tracking-tight text-foreground truncate">
          {title}
        </h3>
      </div>
      {rightSlot ? (
        rightSlot
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="flex flex-shrink-0 items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors"
        >
          {actionLabel}
          <ChevronRight className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
};
