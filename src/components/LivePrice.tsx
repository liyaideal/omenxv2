import { useState, useEffect, memo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimePricesOptional } from "@/contexts/RealtimePricesContext";

interface LivePriceProps {
  optionId: string;
  fallbackPrice?: number | string;
  className?: string;
  showChange?: boolean;
  prefix?: string;
  decimals?: number;
}

export const LivePrice = memo(({ 
  optionId, 
  fallbackPrice, 
  className,
  showChange = false,
  prefix = "$",
  decimals = 2,
}: LivePriceProps) => {
  const pricesContext = useRealtimePricesOptional();
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  // Get live price or fallback
  const livePrice = pricesContext?.getPrice(optionId);
  const previousPrice = pricesContext?.getPreviousPrice(optionId);
  const priceChange = pricesContext?.getPriceChange(optionId) ?? "none";
  
  const displayPrice = livePrice ?? (typeof fallbackPrice === 'string' ? parseFloat(fallbackPrice) : fallbackPrice) ?? 0;

  // Flash animation when price changes
  useEffect(() => {
    if (priceChange !== "none" && livePrice !== undefined) {
      setFlash(priceChange);
      const timer = setTimeout(() => setFlash(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [livePrice, priceChange]);

  const formattedPrice = `${prefix}${displayPrice.toFixed(decimals)}`;

  return (
    <span
      className={cn(
        "font-mono transition-all duration-300",
        flash === "up" && "text-trading-green animate-pulse",
        flash === "down" && "text-trading-red animate-pulse",
        className
      )}
    >
      {formattedPrice}
      {showChange && priceChange !== "none" && (
        <span className="ml-1 inline-flex items-center">
          {priceChange === "up" ? (
            <TrendingUp className="h-3 w-3 text-trading-green" />
          ) : (
            <TrendingDown className="h-3 w-3 text-trading-red" />
          )}
        </span>
      )}
    </span>
  );
});

LivePrice.displayName = "LivePrice";

// Compact version for tight spaces
interface LivePriceBadgeProps {
  optionId: string;
  label: string;
  fallbackPrice?: number | string;
  isSelected?: boolean;
  onClick?: () => void;
}

export const LivePriceBadge = memo(({
  optionId,
  label,
  fallbackPrice,
  isSelected = false,
  onClick,
}: LivePriceBadgeProps) => {
  const pricesContext = useRealtimePricesOptional();
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  const livePrice = pricesContext?.getPrice(optionId);
  const priceChange = pricesContext?.getPriceChange(optionId) ?? "none";
  
  const displayPrice = livePrice ?? (typeof fallbackPrice === 'string' ? parseFloat(fallbackPrice) : fallbackPrice) ?? 0;

  // Flash animation when price changes
  useEffect(() => {
    if (priceChange !== "none" && livePrice !== undefined) {
      setFlash(priceChange);
      const timer = setTimeout(() => setFlash(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [livePrice, priceChange]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200",
        "border text-sm",
        isSelected
          ? "bg-primary/20 border-primary/50 text-foreground"
          : "bg-card/50 border-border/30 text-muted-foreground hover:border-primary/30",
        flash === "up" && "ring-1 ring-trading-green/50",
        flash === "down" && "ring-1 ring-trading-red/50"
      )}
    >
      <span className="truncate mr-2">{label}</span>
      <span
        className={cn(
          "font-mono font-medium transition-colors duration-300",
          flash === "up" && "text-trading-green",
          flash === "down" && "text-trading-red",
          !flash && (isSelected ? "text-primary" : "text-foreground")
        )}
      >
        ${displayPrice.toFixed(2)}
      </span>
    </button>
  );
});

LivePriceBadge.displayName = "LivePriceBadge";

export default LivePrice;
