import { cn } from "@/lib/utils";

interface MainnetBadgeProps {
  className?: string;
  size?: "sm" | "md";
  /** Hide on narrow viewports to avoid header overflow. */
  responsive?: boolean;
}

/**
 * Permanent brand signal that the platform is live on mainnet.
 * Independent of activation flow — kept after Launch Campaign ends.
 */
export const MainnetBadge = ({ className, size = "sm", responsive = true }: MainnetBadgeProps) => {
  const textSize = size === "md" ? "text-[10px]" : "text-[9px]";
  return (
    <span
      className={cn(
        "items-center gap-1 rounded-sm border border-trading-green/40 bg-trading-green/10 px-1.5 py-0.5 font-mono uppercase tracking-wider text-trading-green",
        responsive ? "hidden sm:inline-flex" : "inline-flex",
        textSize,
        className,
      )}
      aria-label="Live on mainnet"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-trading-green animate-pulse" />
      Mainnet
    </span>
  );
};
