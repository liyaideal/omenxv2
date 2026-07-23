import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ChevronRight, ChevronDown, Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { NewBadge } from "./NewBadge";
import { ClosingSoonCountdown } from "./ClosingSoonCountdown";
import { EventRow, MarketChildRow, ChgTimeframe, getChange, getVolume } from "@/hooks/useMarketListData";
import { CATEGORY_STYLES, CategoryType } from "@/lib/categoryUtils";
import { ProductLineBadge } from "@/lib/productLineBadge";
import { cn } from "@/lib/utils";

interface MarketListViewProps {
  markets: EventRow[];
  isWatched: (id: string) => boolean;
  onToggleWatch: (id: string, e?: React.MouseEvent) => void;
  chgTimeframe?: ChgTimeframe;
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
  const days = Math.floor(diff / 86400000);
  if (days > 30) return `${Math.floor(days / 30)}mo`;
  if (days > 0) return `${days}d`;
  const hours = Math.floor(diff / 3600000);
  return `${hours}h`;
};

/* ── Event parent row ── */
const EventRowContent = ({
  row,
  isExpanded,
  onToggleExpand,
  isWatched,
  onToggleWatch,
  onClick,
  chgTimeframe = "24h",
}: {
  row: EventRow;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isWatched: boolean;
  onToggleWatch: (e?: React.MouseEvent) => void;
  onClick: () => void;
  chgTimeframe?: ChgTimeframe;
}) => {
  const catStyle = CATEGORY_STYLES[row.categoryLabel as CategoryType] || CATEGORY_STYLES.General;

  return (
    <tr
      className="h-14 border-b border-border/20 transition-colors cursor-pointer hover:bg-muted/30"
      onClick={onClick}
    >
      {/* Star */}
      <td className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={(e) => onToggleWatch(e)} className="p-1 transition-transform active:scale-125">
          <Star className={cn("h-4 w-4", isWatched ? "fill-trading-yellow text-trading-yellow" : "text-muted-foreground")} />
        </button>
      </td>

      {/* Event */}
      <td className="pr-3">
        <div className="flex items-center gap-2 min-w-0">
          {row.children.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
              className="p-0.5 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm font-medium text-foreground truncate">{row.eventName}</span>
              {row.productLines?.includes("spot") && <ProductLineBadge line="spot" />}
              {row.isNew && <NewBadge />}
              {row.children.length > 0 && (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{row.childCount} markets</span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="w-[100px]">
        <Badge variant={catStyle.variant || "general"} className="text-[10px] border-0 px-2 py-0.5">
          {row.categoryLabel}
        </Badge>
      </td>

      {/* Change */}
      <td className={cn("w-[100px] text-right font-mono text-sm", getChange(row, chgTimeframe) >= 0 ? "text-trading-green" : "text-trading-red")}>
        {getChange(row, chgTimeframe) >= 0 ? "+" : ""}{getChange(row, chgTimeframe).toFixed(2)}%
      </td>

      {/* Volume */}
      <td className="w-[110px] text-right font-mono text-sm text-muted-foreground">
        {formatUSD(getVolume(row, chgTimeframe))}
      </td>

      {/* Total Vol */}
      <td className="w-[100px] text-right font-mono text-sm text-muted-foreground">
        {formatUSD(row.totalVolume)}
      </td>

      {/* Expiry */}
      <td className="w-[100px] text-right text-sm">
        {row.isClosingSoon && row.expiry ? (
          <ClosingSoonCountdown endDate={row.expiry} />
        ) : (
          <span className="text-muted-foreground font-mono">{formatExpiry(row.expiry)}</span>
        )}
      </td>

      {/* Arrow */}
      <td className="w-10 text-center">
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity inline-block" />
      </td>
    </tr>
  );
};

/* ── Market child row ── */
const ChildRowContent = ({
  child,
  onClick,
  chgTimeframe = "24h",
}: {
  child: MarketChildRow;
  onClick: () => void;
  chgTimeframe?: ChgTimeframe;
}) => {
  const chgVal = getChange(child, chgTimeframe);
  const volVal = getVolume(child, chgTimeframe);
  return (
  <tr
    className="h-12 border-b border-border/20 transition-colors cursor-pointer bg-muted/20 hover:bg-muted/30"
    onClick={onClick}
  >
    {/* empty star column */}
    <td className="w-10" />

    {/* Market name (indented) */}
    <td className="pr-3 pl-8">
      <span className="text-sm text-muted-foreground">● {child.displayLabel}</span>
    </td>

    {/* Price (Yes price; No = 1 − Yes) */}
    <td className="w-[90px] text-right font-mono text-sm text-foreground">
      ${child.markPrice.toFixed(2)}
    </td>

    {/* Change */}
    <td className={cn("w-[100px] text-right font-mono text-sm", chgVal >= 0 ? "text-trading-green" : "text-trading-red")}>
      {chgVal >= 0 ? "+" : ""}{chgVal.toFixed(2)}%
    </td>

    {/* Volume */}
    <td className="w-[110px] text-right font-mono text-sm text-muted-foreground">
      {formatUSD(volVal)}
    </td>

    {/* Total Vol */}
    <td className="w-[100px] text-right font-mono text-sm text-muted-foreground">
      {formatUSD(child.totalVolume)}
    </td>

    {/* Funding Rate (replaces Expiry position) */}
    <td className={cn("w-[100px] text-right font-mono text-sm", child.fundingRate >= 0 ? "text-trading-green" : "text-trading-red")}>
      {child.fundingRate >= 0 ? "+" : ""}{(child.fundingRate * 100).toFixed(3)}%
    </td>

    {/* Arrow */}
    <td className="w-10 text-center">
      <ChevronRight className="h-4 w-4 text-muted-foreground inline-block" />
    </td>
  </tr>
  );
};

export const MarketListView = ({ markets, isWatched, onToggleWatch, chgTimeframe = "24h" }: MarketListViewProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem("market_expanded");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      sessionStorage.setItem("market_expanded", JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30 text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="w-10" />
            <th className="text-left py-3 pr-3 font-medium">Event</th>
            <th className="text-left py-3 font-medium w-[100px]">Category</th>
            <th className="text-right py-3 font-medium w-[100px]">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 cursor-help">
                      {chgTimeframe.toUpperCase()} Chg <Info className="h-3 w-3 text-muted-foreground/60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                    Based on the market with highest 24h volume
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </th>
            <th className="text-right py-3 font-medium w-[110px]">{chgTimeframe.toUpperCase()} Vol</th>
            <th className="text-right py-3 font-medium w-[100px]">Total Vol</th>
            <th className="text-right py-3 font-medium w-[100px]">Expiry</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {markets.map((row) => {
            const isExp = expanded.has(row.id);
            return (
              <RowGroup key={row.id}>
                <EventRowContent
                  row={row}
                  isExpanded={isExp}
                  onToggleExpand={() => toggleExpand(row.id)}
                  isWatched={isWatched(row.eventId)}
                  onToggleWatch={(e) => onToggleWatch(row.eventId, e)}
                  onClick={() => navigate(row.productLines?.includes("spot") ? `/spot?event=${row.eventId}` : `/trade?event=${row.eventId}`)}
                  chgTimeframe={chgTimeframe}
                />
                {isExp && (
                  <>
                    <tr className="h-8 bg-muted/40 border-b border-border/20">
                      <td className="w-10" />
                      <td className="pr-3 pl-8 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Market</td>
                      <td className="w-[90px] text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                Price <Info className="h-3 w-3 text-muted-foreground/60" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                              Showing Yes price. No price = 1 − Yes. Learn more in Glossary.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="w-[100px] text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{chgTimeframe.toUpperCase()} Chg</td>
                      <td className="w-[110px] text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{chgTimeframe.toUpperCase()} Vol</td>
                      <td className="w-[100px] text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Vol</td>
                      <td className="w-[100px] text-right text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Funding</td>
                      <td className="w-10" />
                    </tr>
                    {row.children.map((child) => (
                      <ChildRowContent
                        key={child.id}
                        child={child}
                        onClick={() => navigate(row.productLines?.includes("spot") ? `/spot?event=${row.eventId}` : `/trade?event=${row.eventId}`)}
                        chgTimeframe={chgTimeframe}
                      />
                    ))}
                  </>
                )}
              </RowGroup>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const RowGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
