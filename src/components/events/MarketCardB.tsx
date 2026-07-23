import { useNavigate } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NewBadge } from "./NewBadge";
import { ClosingSoonCountdown } from "./ClosingSoonCountdown";
import { EventRow, ChgTimeframe, getChange, getVolume } from "@/hooks/useMarketListData";
import { CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";
import { ProductLineBadge } from "@/lib/productLineBadge";
import { cn } from "@/lib/utils";

interface MarketCardBProps {
  market: EventRow;
  isWatched: boolean;
  onToggleWatch: (e?: React.MouseEvent) => void;
  chgTimeframe?: ChgTimeframe;
  /** Render with transparent surface (no gradient bg, no category image, no border). */
  noBackground?: boolean;
}

const formatUSD = (val: number): string => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
};

const formatExpiry = (date: Date | null) => {
  if (!date) return "—";
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.ceil(diff / 86400000);
  if (days > 30) return `${Math.floor(days / 30)}mo`;
  return `${days}d`;
};

const TF_LABELS: Record<ChgTimeframe, string> = {
  "1h": "1H CHG",
  "4h": "4H CHG",
  "24h": "24H CHG",
};

export const MarketCardB = ({ market, isWatched, onToggleWatch, chgTimeframe = "24h", noBackground = false }: MarketCardBProps) => {
  const navigate = useNavigate();
  const catStyle = CATEGORY_STYLES[market.categoryLabel as CategoryType] || CATEGORY_STYLES.General;
  const hasMultipleMarkets = market.children.length > 0;
  const chgValue = getChange(market, chgTimeframe);
  const volValue = getVolume(market, chgTimeframe);
  const cardBg = catStyle.cardBg;

  return (
    <div
      className={cn(
        "group relative rounded-xl p-3 cursor-pointer transition-all overflow-hidden",
        noBackground
          ? "border border-transparent hover:border-primary/40"
          : "border border-border/40 hover:border-primary/40",
      )}
      style={noBackground ? undefined : { background: "var(--gradient-market-card)" }}
      onClick={() => navigate(market.productLines?.includes("spot") ? `/spot?event=${market.eventId}` : `/trade?event=${market.eventId}`)}
    >
      {/* Category background image */}
      {!noBackground && cardBg && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={cardBg}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover opacity-[0.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(225_40%_7%)] via-[hsl(225_40%_7%/0.65)] to-transparent" />
        </div>
      )}

      {/* Content layer above background */}
      <div className="relative z-10">
      {/* Top Row: Star + Badge + NEW ... Expiry */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWatch(e); }}
            className="p-0.5 transition-transform active:scale-125"
          >
            <Star className={cn("h-3.5 w-3.5", isWatched ? "fill-trading-yellow text-trading-yellow" : "text-muted-foreground")} />
          </button>
          <Badge variant={catStyle.variant || "general"} className="text-[10px] border-0 px-1.5 py-0">
            {market.categoryLabel}
          </Badge>
          {market.productLines?.includes("spot") && <ProductLineBadge line="spot" />}
          {market.isNew && <NewBadge />}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          {market.isClosingSoon && market.expiry ? (
            <ClosingSoonCountdown endDate={market.expiry} />
          ) : (
            formatExpiry(market.expiry)
          )}
        </div>
      </div>

      {/* Title - single line */}
      <h3 className="text-[15px] font-semibold text-foreground leading-tight mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
        {market.eventName}
      </h3>

      {/* Outcome mini-table */}
      {market.children.length > 0 ? (
        <div className="bg-white/[0.03] rounded-lg px-2 py-1 space-y-0.5 mb-1.5">
          <div className="flex justify-end -mb-0.5">
            <span className="text-[9px] font-mono text-muted-foreground/60 leading-none">{TF_LABELS[chgTimeframe]}</span>
          </div>
          {market.children.slice(0, 3).map((child) => {
            const chg = getChange(child, chgTimeframe);
            return (
              <div key={child.id} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground truncate max-w-[60%]">{child.displayLabel}</span>
                <span className={cn("text-[11px] font-mono font-semibold whitespace-nowrap tabular-nums", chg >= 0 ? "text-trading-green" : "text-trading-red")}>
                  {chg >= 0 ? "▲" : "▼"} {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                </span>
              </div>
            );
          })}
          {Array.from({ length: Math.max(0, 3 - Math.min(market.children.length, 3)) }).map((_, i) => (
            <div key={`ph-${i}`} className="hidden md:flex items-center justify-between" aria-hidden>
              <span className="text-[11px] invisible">&nbsp;</span>
              <span className="text-[11px] font-mono font-semibold tabular-nums invisible">+0.00%</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/[0.03] rounded-lg px-2 py-1 mb-1.5">
          <div className="flex justify-end -mb-0.5">
            <span className="text-[9px] font-mono text-muted-foreground/60 leading-none">{TF_LABELS[chgTimeframe]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[11px] font-mono font-semibold tabular-nums", chgValue >= 0 ? "text-trading-green" : "text-trading-red")}>
              {chgValue >= 0 ? "▲" : "▼"} {chgValue >= 0 ? "+" : ""}{chgValue.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* Footer row – +N more left, Total Vol right */}
      <div className="pt-1 border-t border-border/20 flex items-center justify-between text-[10px]">
        <span className="font-mono text-muted-foreground">Vol: {formatUSD(market.totalVolume)}</span>
        {market.children.length > 3 ? (
          <div className="flex items-center gap-1 text-primary">
            <span className="font-medium">+{market.children.length - 3} more markets</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        ) : (
          <span />
        )}
      </div>
      </div>
    </div>
  );
};
