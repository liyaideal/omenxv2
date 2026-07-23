import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ResolvedEvent } from "@/hooks/useResolvedEvents";
import { getCategoryInfo, CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";
import { getDisplayOptionLabel } from "@/lib/eventUtils";
import { ProductLineBadge } from "@/lib/productLineBadge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ResolvedMarketCardProps {
  event: ResolvedEvent;
  onClick?: () => void;
}

const formatVolume = (volume: string | null): string => {
  if (!volume) return "$0";
  const num = parseFloat(volume.replace(/[$,]/g, ""));
  if (isNaN(num)) return volume;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
};

/**
 * Resolved counterpart to MarketCardB. Shares the visual skeleton
 * (category bg image + gradient surface + rounded border + hover state)
 * but renders settlement-specific fields. Per card-style-isolation memory,
 * we do not modify MarketCardB — we own this file independently.
 */
export const ResolvedMarketCard = ({ event, onClick }: ResolvedMarketCardProps) => {
  const categoryInfo = getCategoryInfo(event.category);
  const catStyle =
    CATEGORY_STYLES[categoryInfo.label as CategoryType] || CATEGORY_STYLES.General;
  const cardBg = catStyle.cardBg;

  const settledDate = event.settled_at
    ? format(new Date(event.settled_at), "MMM d, yyyy")
    : "—";

  const winner = event.options.find((o) => o.is_winner);

  return (
    <div
      className="group relative rounded-xl p-3 cursor-pointer transition-all overflow-hidden border border-border/40 hover:border-primary/40"
      style={{ background: "var(--gradient-market-card)" }}
      onClick={onClick}
    >
      {/* Category background image */}
      {cardBg && (
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

      <div className="relative z-10">
        {/* Top row: category + settled date */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Badge
              variant={catStyle.variant || "general"}
              className="text-[10px] border-0 px-1.5 py-0"
            >
              {categoryInfo.label}
            </Badge>
            {event.productLines?.includes("spot") && <ProductLineBadge line="spot" />}
            <Badge
              variant="outline"
              className="text-[10px] font-semibold uppercase tracking-wide bg-muted/40 text-muted-foreground border-border/50 px-1.5 py-0"
            >
              Settled
            </Badge>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {settledDate}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold text-foreground leading-tight mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
          {event.name}
        </h3>

        {/* Winner row */}
        <div className="bg-white/[0.03] rounded-lg px-2 py-1.5 mb-1.5 flex items-center gap-1.5 min-h-[28px]">
          {winner ? (
            <>
              <Check className="h-3.5 w-3.5 text-trading-green flex-shrink-0" />
              <span className="text-[12px] font-medium text-trading-green truncate">
                {getDisplayOptionLabel(winner.label, event.options, event.sideLabels)}
              </span>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground">No winner recorded</span>
          )}
        </div>

        {/* Footer row: vol left, PnL chip right */}
        <div className="pt-1 border-t border-border/20 flex items-center justify-between text-[10px]">
          <span className="font-mono text-muted-foreground">
            Vol: {formatVolume(event.volume)}
          </span>
          {event.userParticipated && event.userPnl !== null ? (
            <span
              className={cn(
                "font-mono font-semibold tabular-nums px-1.5 py-0.5 rounded border",
                event.userPnl >= 0
                  ? "text-trading-green bg-trading-green/10 border-trading-green/30"
                  : "text-trading-red bg-trading-red/10 border-trading-red/30",
              )}
            >
              {event.userPnl >= 0 ? "+" : "-"}${Math.abs(event.userPnl).toFixed(0)}
            </span>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
};
