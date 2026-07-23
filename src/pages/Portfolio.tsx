import { useState, useMemo } from "react";
import { useNavigate, useNavigationType } from "react-router-dom";
import { ArrowUpDown, TrendingUp, TrendingDown, Wallet, BarChart3, ChevronRight, Info, AlertTriangle, Loader2, Gift, Inbox, Trophy } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePositions } from "@/hooks/usePositions";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useSettlements } from "@/hooks/useSettlements";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";
import { EmptyState, LoadingState, ErrorState } from "@/components/states";
import { RISK_STYLES, getRiskTier, STATUS_STYLES } from "@/lib/statusStyles";
import { useEventDisplayLookup } from "@/hooks/useEventDisplayLookup";
import { useRealtimePositionsPnL } from "@/hooks/useRealtimePositionsPnL";
import { useRealtimeRiskMetrics } from "@/hooks/useRealtimeRiskMetrics";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { AirdropPositionCard } from "@/components/AirdropPositionCard";
import { VoucherBanner } from "@/components/vouchers/VoucherBanner";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TRADING_TERMS } from "@/lib/tradingTerms";
import { getBinaryOutcome } from "@/lib/eventUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SortField = "pnl" | "size" | "event" | null;
type SortDirection = "asc" | "desc";
type TabType = "positions" | "settlements" | "airdrops";

// Portfolio Tab 下拉组件 - 类似 Events 的 Active/Resolved 切换
const PortfolioTabDropdown = ({
  activeTab,
  onTabChange,
  positionsCount,
  settlementsCount,
  airdropsCount,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  positionsCount: number;
  settlementsCount: number;
  airdropsCount: number;
}) => {
  const tabOptions: { value: TabType; label: string }[] = [
    { value: "positions", label: `Positions (${positionsCount})` },
    { value: "settlements", label: `Settlements (${settlementsCount})` },
    { value: "airdrops", label: `Airdrops (${airdropsCount})` },
  ];

  return (
    <Select value={activeTab} onValueChange={(v) => onTabChange(v as TabType)}>
      <SelectTrigger className="w-[140px] bg-secondary border-border/50 h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {tabOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default function Portfolio() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { user, isLoading: authLoading } = useUserProfile();
  const { positions, isLoading: positionsLoading, isError: positionsError, refetch: refetchPositions } = usePositions();
  const { data: settlements = [], isLoading: settlementsLoading, isError: settlementsError, refetch: refetchSettlements } = useSettlements();
  const { airdrops, closePosition } = useAirdropPositions();
  const resolveDisplayOption = useEventDisplayLookup();
  const { calculateRealtimePnL, formatPnL, formatMarkPrice } = useRealtimePositionsPnL();
  // Use the same risk metrics as the Account Risk module in /trade
  const riskMetrics = useRealtimeRiskMetrics();
  const [activeTab, setActiveTab] = useState<TabType>("positions");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Use centralized risk metrics from useRealtimeRiskMetrics (same as Account Risk module)
  const positionsStats = useMemo(() => {
    // Calculate ROI: (Unrealized P&L / IM) * 100
    const roi = riskMetrics.imTotal > 0 ? (riskMetrics.unrealizedPnL / riskMetrics.imTotal) * 100 : 0;

    return {
      unrealizedPnL: riskMetrics.unrealizedPnL,
      imTotal: riskMetrics.imTotal,
      mmTotal: riskMetrics.mmTotal,
      roi,
      riskRatio: riskMetrics.riskRatio,
    };
  }, [riskMetrics]);

  // Calculate settlements stats from real data
  const settlementsStats = useMemo(() => {
    const totalPnl = settlements.reduce((sum, s) => {
      const pnlValue = parseFloat(s.pnl.replace(/[$,+]/g, "")) || 0;
      return sum + pnlValue;
    }, 0);

    const winCount = settlements.filter((s) => s.result === "win").length;
    const winRate = settlements.length > 0 
      ? ((winCount / settlements.length) * 100).toFixed(0)
      : "0";

    return {
      totalPnl,
      winCount,
      winRate,
      totalCount: settlements.length,
    };
  }, [settlements]);

  // Sort positions
  const sortedPositions = useMemo(() => {
    if (!sortField) return positions;

    return [...positions].sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortField) {
        case "pnl":
          aValue = parseFloat(String(a.pnl).replace(/[$,+]/g, "")) || 0;
          bValue = parseFloat(String(b.pnl).replace(/[$,+]/g, "")) || 0;
          break;
        case "size":
          aValue = parseFloat(String(a.size).replace(/,/g, "")) || 0;
          bValue = parseFloat(String(b.size).replace(/,/g, "")) || 0;
          break;
        default:
          return 0;
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [positions, sortField, sortDirection]);


  // Sort settlements
  const sortedSettlements = useMemo(() => {
    if (!sortField) return settlements;

    return [...settlements].sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortField) {
        case "pnl":
          aValue = parseFloat(a.pnl.replace(/[$,+]/g, "")) || 0;
          bValue = parseFloat(b.pnl.replace(/[$,+]/g, "")) || 0;
          break;
        case "size":
          aValue = parseFloat(a.size.replace(/,/g, "")) || 0;
          bValue = parseFloat(b.size.replace(/,/g, "")) || 0;
          break;
        default:
          return 0;
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [settlements, sortField, sortDirection]);

  const isGuest = !authLoading && !user;


  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Lookup event_id from event_name so spot rows can deep-link into /spot?event=
  // (positions table stores event_name, not event_id).
  const { events: activeEventsForLookup } = useActiveEvents();
  const eventIdByName = useMemo(() => {
    const m = new Map<string, string>();
    (activeEventsForLookup ?? []).forEach((e) => m.set(e.name, e.id));
    return m;
  }, [activeEventsForLookup]);

  const handlePositionAction = (index: number) => {
    // Read from sortedPositions — rows render from that array, so `index` is a
    // sorted-index. Reading `positions[index]` would route the wrong row after
    // sorting by PnL/Qty (spot ↔ futures cross-routing).
    const target = sortedPositions[index];
    if (!target) return;
    // Spot positions live on /spot; deep-link when we can resolve the event id.
    if (target.productLine === "spot") {
      const eid = eventIdByName.get(target.event);
      if (eid) {
        navigate(`/spot?event=${eid}`);
        return;
      }
      navigate("/spot");
      return;
    }
    // Futures destination filters spot out — recompute the highlight index
    // against the destination's futures-only ordering by matching position id.
    const futuresPositions = positions.filter((p) => p.productLine !== "spot");
    const highlightIdx = futuresPositions.findIndex((p) => p.id === target.id);
    const state = highlightIdx >= 0
      ? { tab: "Positions", highlightPosition: highlightIdx }
      : { tab: "Positions" };
    if (isMobile) {
      navigate("/trade/order", { state });
    } else {
      navigate("/trade", { state });
    }
  };

  const handleSettlementAction = (id: string) => {
    navigate(`/portfolio/settlement/${id}`);
  };

  const isProfitable = (pnl: string) => !pnl.startsWith("-");

  const showBackButton = navigationType === "PUSH";

  return (
    <div 
      className={`min-h-screen ${isMobile ? "pb-24" : ""}`}
      style={{
        background: isMobile 
          ? "hsl(222 47% 6%)" 
          : "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(260 50% 15% / 0.3) 0%, hsl(222 47% 6%) 70%)"
      }}
    >
      {/* Header - 主入口页：Logo + Tab下拉切换 */}
      {isMobile ? (
        <MobileHeader 
          showLogo
          rightContent={
            <PortfolioTabDropdown
              activeTab={activeTab}
              onTabChange={(tab) => {
                if (tab === "settlements") navigate("/portfolio/settlements");
                else if (tab === "airdrops") navigate("/portfolio/airdrops");
                else setActiveTab(tab);
              }}
              positionsCount={positions.length}
              settlementsCount={settlements.length}
              airdropsCount={airdrops.length}
            />
          }
        />
      ) : (
        <EventsDesktopHeader />
      )}

      <AuthGateOverlay title="Sign in to view your portfolio" description="Track your open positions and settlement history by signing in to your account." maxPreviewHeight="400px">
      <main className={`${isMobile ? "px-4 py-6" : "px-8 py-10 max-w-7xl mx-auto"} space-y-6`}>
        {/* Page Title */}
        {!isMobile && <PageHeader title="Portfolio" subtitle="Track your open positions and settlement history" />}

        <VoucherBanner />


        {/* Desktop Tabs - 桌面端保留原有tabs */}
        {!isMobile && (
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("positions")}
              className={`py-2 px-4 text-sm font-medium transition-all ${
                activeTab === "positions"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              Positions ({positions.length})
            </button>
            <button
              onClick={() => navigate("/portfolio/settlements")}
              className="py-2 px-4 text-sm font-medium transition-all text-muted-foreground"
            >
              Settlements ({settlements.length})
            </button>
            <button
              onClick={() => navigate("/portfolio/airdrops")}
              className="py-2 px-4 text-sm font-medium transition-all text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                Airdrops ({airdrops.length})
              </span>
            </button>
          </div>
        )}

        {/* Content */}
        {activeTab === "positions" && (
          <>
            {/* Positions Stats Cards - aligned with Account Risk module */}
            <div className={`grid gap-3 mb-6 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
              {/* Unrealized P&L + ROI % */}
              <div className="stats-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Unrealized P&L</span>
                  {isMobile ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </PopoverTrigger>
                      <PopoverContent className="text-xs w-64">
                        Total unrealized profit/loss across all open positions, calculated as (Mark Price - Entry Price) × Qty for each position.
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-64">
                        Total unrealized profit/loss across all open positions, calculated as (Mark Price - Entry Price) × Qty for each position.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className={`text-lg font-bold font-mono truncate ${
                      positionsStats.unrealizedPnL >= 0 ? "text-trading-green" : "text-trading-red"
                    }`}
                  >
                    {positionsStats.unrealizedPnL >= 0 ? "+" : ""}${Math.abs(positionsStats.unrealizedPnL).toFixed(2)}
                  </span>
                  <span
                    className={`text-xs font-mono whitespace-nowrap ${
                      positionsStats.roi >= 0 ? "text-trading-green" : "text-trading-red"
                    }`}
                  >
                    ({positionsStats.roi >= 0 ? "+" : ""}{positionsStats.roi.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Initial Margin */}
              <div className="stats-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Initial Margin</span>
                  {isMobile ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </PopoverTrigger>
                      <PopoverContent className="text-xs w-64">
                        Entry threshold - determines if you can open positions. Sum of margin locked in all open positions.
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-64">
                        Entry threshold - determines if you can open positions. Sum of margin locked in all open positions.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="text-lg font-bold font-mono">
                  ${positionsStats.imTotal.toFixed(2)}
                </div>
              </div>

              {/* Maintenance Margin */}
              <div className="stats-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Maint. Margin</span>
                  {isMobile ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </PopoverTrigger>
                      <PopoverContent className="text-xs w-64">
                        Survival line - determines if you'll be liquidated. Typically 50% of Initial Margin.
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-64">
                        Survival line - determines if you'll be liquidated. Typically 50% of Initial Margin.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="text-lg font-bold font-mono">
                  ${positionsStats.mmTotal.toFixed(2)}
                </div>
              </div>

              {/* Risk Ratio */}
              <div className="stats-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Risk Ratio</span>
                  {isMobile ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </PopoverTrigger>
                      <PopoverContent className="text-xs w-64">
                        <p className="mb-2"><strong>Risk Ratio</strong> = IM / Equity</p>
                        <div className="space-y-1">
                          <p className={RISK_STYLES.SAFE.fg}>{RISK_STYLES.SAFE.label.toUpperCase()}: &lt;80%</p>
                          <p className={RISK_STYLES.WARNING.fg}>{RISK_STYLES.WARNING.label.toUpperCase()}: 80-95%</p>
                          <p className={RISK_STYLES.RESTRICTION.fg}>{RISK_STYLES.RESTRICTION.label.toUpperCase()}: 95-100%</p>
                          <p className={RISK_STYLES.LIQUIDATION.fg}>{RISK_STYLES.LIQUIDATION.label.toUpperCase()}: ≥100%</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-64">
                        <p className="mb-2"><strong>Risk Ratio</strong> = IM / Equity</p>
                        <div className="space-y-1">
                          <p className={RISK_STYLES.SAFE.fg}>{RISK_STYLES.SAFE.label.toUpperCase()}: &lt;80%</p>
                          <p className={RISK_STYLES.WARNING.fg}>{RISK_STYLES.WARNING.label.toUpperCase()}: 80-95%</p>
                          <p className={RISK_STYLES.RESTRICTION.fg}>{RISK_STYLES.RESTRICTION.label.toUpperCase()}: 95-100%</p>
                          <p className={RISK_STYLES.LIQUIDATION.fg}>{RISK_STYLES.LIQUIDATION.label.toUpperCase()}: ≥100%</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className={`text-lg font-bold font-mono ${RISK_STYLES[getRiskTier(positionsStats.riskRatio)].fg}`}>
                  {positionsStats.riskRatio.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Binary Event Hint - show if any position is from binary event */}

            {positionsLoading ? (
              <LoadingState variant="skeleton" label="Loading positions…" skeletonRows={4} />
            ) : positionsError ? (
              <ErrorState
                title="Couldn't load positions"
                description="Something went wrong fetching your open positions."
                onRetry={() => refetchPositions()}
              />
            ) : sortedPositions.length === 0 ? (
              <EmptyState
                variant="card"
                icon={Wallet}
                title="No open positions"
                description="Your open positions will appear here once you enter a trade."
              />
            ) : isMobile ? (
              /* Mobile: Card View */
              <div className="space-y-3">
                {sortedPositions.map((position, index) => {
                  // Calculate realtime PnL for this position
                  const realtimePnL = calculateRealtimePnL(position);
                  const { pnlStr, pnlPercentStr } = formatPnL(realtimePnL.pnl, realtimePnL.pnlPercent);
                  const displayMarkPrice = realtimePnL.hasRealtimePrice 
                    ? formatMarkPrice(realtimePnL.markPrice) 
                    : position.markPrice;
                  const isPositionProfitable = realtimePnL.pnl >= 0;

                  return (
                    <div
                      key={index}
                      className="bg-card rounded-xl p-3"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const outcome = getBinaryOutcome(position.option);
                            // binary 行：完全不渲染 Yes/No badge，outcome 颜色挪到下方主标签
                            if (outcome) return null;
                            // 非 binary（多 outcome）chip 显示方向 Yes/No，不显示 option 名
                            const isLong = position.type === "long";
                            const colorClass = isLong
                              ? "border-trading-green/50 text-trading-green bg-trading-green/10"
                              : "border-trading-red/50 text-trading-red bg-trading-red/10";
                            return (
                              <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
                                {isLong ? "Yes" : "No"}
                              </Badge>
                            );
                          })()}
                          {position.productLine === "spot" ? (
                            <Badge variant="outline" className="text-[10px]">SPOT</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">{position.leverage}</span>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-1 text-xs font-semibold ${
                            isPositionProfitable
                              ? "text-trading-green"
                              : "text-trading-red"
                          }`}
                        >
                          {isPositionProfitable ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {pnlStr} ({pnlPercentStr})
                        </div>
                      </div>

                      {/* Event Info */}
                      <div className="mb-2">
                        <h3 className="font-medium text-sm line-clamp-1">
                          {position.event}
                        </h3>
                        {(() => {
                          const outcome = getBinaryOutcome(position.option);
                          const colorClass = outcome === "yes"
                            ? "text-trading-green"
                            : outcome === "no"
                            ? "text-trading-red"
                            : "text-muted-foreground";
                          return (
                            <p className={`text-xs ${colorClass}`}>
                              {position.displayOption ?? position.option}
                            </p>
                          );
                        })()}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            {TRADING_TERMS.QTY}
                          </span>
                          <span className="font-mono text-xs">{position.sizeDisplay}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Entry
                          </span>
                          <span className="font-mono text-xs">
                            {position.entryPrice}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Mark
                          </span>
                          <span className="font-mono text-xs">
                            {displayMarkPrice}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            {TRADING_TERMS.MARGIN}
                          </span>
                          <span className="font-mono text-xs">{position.margin}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handlePositionAction(index)}
                      >
                        {TRADING_TERMS.VIEW}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop: Table View */
              <div className="trading-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[200px]">{TRADING_TERMS.CONTRACT}</TableHead>
                      <TableHead>{TRADING_TERMS.SIDE}</TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("size")}
                      >
                        <div className="flex items-center gap-1">
                          {TRADING_TERMS.QTY}
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead>{TRADING_TERMS.ENTRY_PRICE}</TableHead>
                      <TableHead>{TRADING_TERMS.MARK_PRICE}</TableHead>
                      <TableHead>{TRADING_TERMS.MARGIN}</TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("pnl")}
                      >
                        <div className="flex items-center gap-1">
                          {TRADING_TERMS.PNL}
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead>{TRADING_TERMS.TPSL}</TableHead>
                      <TableHead className="text-right">{TRADING_TERMS.ACTION}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPositions.map((position, index) => {
                      // Calculate realtime PnL for this position
                      const realtimePnL = calculateRealtimePnL(position);
                      const { pnlStr, pnlPercentStr } = formatPnL(realtimePnL.pnl, realtimePnL.pnlPercent);
                      const displayMarkPrice = realtimePnL.hasRealtimePrice 
                        ? formatMarkPrice(realtimePnL.markPrice) 
                        : position.markPrice;
                      const isPositionProfitable = realtimePnL.pnl >= 0;

                      return (
                        <TableRow key={index} className="cursor-pointer">
                          <TableCell>
                            {(() => {
                              const outcome = getBinaryOutcome(position.option);
                              const colorClass = outcome === "yes"
                                ? "text-trading-green"
                                : outcome === "no"
                                ? "text-trading-red"
                                : "";
                              return (
                                <div>
                                  <div className={`font-medium text-sm line-clamp-1 ${colorClass}`}>
                                    {position.displayOption ?? position.option}
                                  </div>
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    {position.event}
                                  </div>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {(() => {
                                const outcome = getBinaryOutcome(position.option);
                                // binary 行 Side 列留空，outcome 颜色已上到 Contracts
                                if (outcome) {
                                  return <span className="text-xs text-muted-foreground/40">—</span>;
                                }
                                const isLong = position.type === "long";
                                const colorClass = isLong
                                  ? "border-trading-green/50 text-trading-green bg-trading-green/10"
                                  : "border-trading-red/50 text-trading-red bg-trading-red/10";
                                return (
                                  <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
                                    {isLong ? "Yes" : "No"}
                                  </Badge>
                                );
                              })()}
                              {position.productLine === "spot" ? (
                                <Badge variant="outline" className="text-[10px]">SPOT</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">{position.leverage}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {position.sizeDisplay}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {position.entryPrice}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {displayMarkPrice}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {position.margin}
                          </TableCell>
                          <TableCell>
                            <div
                              className={`font-mono text-sm font-medium ${
                                isPositionProfitable
                                  ? "text-trading-green"
                                  : "text-trading-red"
                              }`}
                            >
                              {pnlStr}
                              <span className="text-xs ml-1 opacity-70">
                                ({pnlPercentStr})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-mono">
                              {position.tp || position.sl ? (
                                <span>
                                  {position.tp && (
                                    <span className="text-trading-green">
                                      {position.tpMode === "%" ? `+${position.tp}%` : `$${position.tp}`}
                                    </span>
                                  )}
                                  {position.tp && position.sl && " / "}
                                  {position.sl && (
                                    <span className="text-trading-red">
                                      {position.slMode === "%" ? `-${position.sl}%` : `$${position.sl}`}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">--</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handlePositionAction(index)}
                            >
                              {TRADING_TERMS.VIEW}
                              <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        {activeTab === "settlements" && (
          <>
            {/* Settlements Stats Cards */}
            <div className={`grid gap-3 mb-6 ${isMobile ? "grid-cols-2" : "grid-cols-2 max-w-lg"}`}>
              {/* Realized P&L */}
              <div className="stats-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Realized P&L</span>
                  {isMobile ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </PopoverTrigger>
                      <PopoverContent className="text-xs w-64">
                        Total profit/loss from all settled (closed) positions. This is your actual realized gain or loss.
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-64">
                        Total profit/loss from all settled (closed) positions. This is your actual realized gain or loss.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div
                  className={`text-lg font-bold font-mono ${
                    settlementsStats.totalPnl >= 0 ? "text-trading-green" : "text-trading-red"
                  }`}
                >
                  {settlementsStats.totalPnl >= 0 ? "+" : ""}${Math.abs(settlementsStats.totalPnl).toFixed(2)}
                </div>
              </div>

              {/* Win Rate */}
              <div className="stats-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Win Rate</span>
                  {isMobile ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </PopoverTrigger>
                      <PopoverContent className="text-xs w-64">
                        Percentage of winning trades. Calculated as (Winning Trades / Total Trades) × 100%.
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 cursor-pointer hover:text-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs max-w-64">
                        Percentage of winning trades. Calculated as (Winning Trades / Total Trades) × 100%.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="text-lg font-bold text-trading-green">
                  {settlementsStats.winRate}%
                </div>
              </div>
            </div>

            {settlementsLoading ? (
              <LoadingState variant="skeleton" label="Loading settlements…" skeletonRows={4} />
            ) : settlementsError ? (
              <ErrorState
                title="Couldn't load settlements"
                description="Something went wrong fetching your settlement history."
                onRetry={() => refetchSettlements()}
              />
            ) : sortedSettlements.length === 0 ? (
              <EmptyState
                variant="card"
                icon={Trophy}
                title="No settlements yet"
                description="Your closed trades will appear here."
              />
            ) : isMobile ? (
              /* Mobile: Card View */
              <div className="space-y-3">
                {sortedSettlements.map((settlement) => (
                  <div
                    key={settlement.id}
                    className="bg-card rounded-xl p-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getBinaryOutcome(settlement.option) ? (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              settlement.side === "long"
                                ? "border-trading-green/50 text-trading-green bg-trading-green/10"
                                : "border-trading-red/50 text-trading-red bg-trading-red/10"
                            }`}
                          >
                            {settlement.side === "long" ? "Yes" : "No"}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            settlement.result === "win" ? STATUS_STYLES.success.badge : STATUS_STYLES.error.badge
                          }`}
                        >
                          {settlement.result === "win" ? "WIN" : "LOSE"}
                        </Badge>
                      </div>
                      <div
                        className={`flex items-center gap-1 text-xs font-semibold ${
                          isProfitable(settlement.pnl)
                            ? "text-trading-green"
                            : "text-trading-red"
                        }`}
                      >
                        {isProfitable(settlement.pnl) ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {settlement.pnl}
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="mb-2">
                      <h3 className="font-medium text-sm line-clamp-1">
                        {settlement.event}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {resolveDisplayOption(settlement.event, settlement.option)}
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Entry
                        </span>
                        <span className="font-mono text-xs">
                          {settlement.entryPrice}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Exit
                        </span>
                        <span className="font-mono text-xs">
                          {settlement.exitPrice}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          {TRADING_TERMS.QTY}
                        </span>
                        <span className="font-mono text-xs">{settlement.size}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Settled
                        </span>
                        <span className="text-xs">{settlement.settledAt}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleSettlementAction(settlement.id)}
                    >
                      {TRADING_TERMS.VIEW}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop: Table View */
              <div className="trading-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[200px]">{TRADING_TERMS.CONTRACT}</TableHead>
                      <TableHead>{TRADING_TERMS.SIDE}</TableHead>
                      <TableHead>{TRADING_TERMS.RESULT}</TableHead>
                      <TableHead>{TRADING_TERMS.ENTRY_PRICE}</TableHead>
                      <TableHead>{TRADING_TERMS.EXIT_PRICE}</TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("size")}
                      >
                        <div className="flex items-center gap-1">
                          {TRADING_TERMS.QTY}
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("pnl")}
                      >
                        <div className="flex items-center gap-1">
                          {TRADING_TERMS.PNL}
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead>{TRADING_TERMS.SETTLED_AT}</TableHead>
                      <TableHead className="text-right">{TRADING_TERMS.ACTION}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSettlements.map((settlement) => (
                      <TableRow key={settlement.id} className="cursor-pointer">
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm line-clamp-1">
                              {resolveDisplayOption(settlement.event, settlement.option)}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {settlement.event}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getBinaryOutcome(settlement.option) ? (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            ) : (
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  settlement.side === "long"
                                    ? "border-trading-green/50 text-trading-green bg-trading-green/10"
                                    : "border-trading-red/50 text-trading-red bg-trading-red/10"
                                }`}
                              >
                                {settlement.side === "long" ? "Yes" : "No"}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {settlement.leverage}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              settlement.result === "win" ? STATUS_STYLES.success.badge : STATUS_STYLES.error.badge
                            }`}
                          >
                            {settlement.result === "win" ? "WIN" : "LOSE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {settlement.entryPrice}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {settlement.exitPrice}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {settlement.size}
                        </TableCell>
                        <TableCell>
                          <div
                            className={`font-mono text-sm font-medium ${
                              isProfitable(settlement.pnl)
                                ? "text-trading-green"
                                : "text-trading-red"
                            }`}
                          >
                            {settlement.pnl}
                            <span className="text-xs ml-1 opacity-70">
                              ({settlement.pnlPercent})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {settlement.settledAt}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleSettlementAction(settlement.id)}
                          >
                            {TRADING_TERMS.VIEW}
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}

        {activeTab === "airdrops" && (
          <div className="space-y-3">
            {airdrops.length === 0 ? (
              <EmptyState
                variant="card"
                icon={Gift}
                title="No airdrops yet"
                description="Connect an external account to start receiving counter-position airdrops."
                action={
                  <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                    Connect Account
                  </Button>
                }
              />
            ) : (
              airdrops.map((airdrop) => (
                <AirdropPositionCard key={airdrop.id} airdrop={airdrop} onClose={closePosition} />
              ))
            )}
          </div>
        )}
      </main>
      </AuthGateOverlay>

      {isMobile && <BottomNav />}
    </div>
  );
}
