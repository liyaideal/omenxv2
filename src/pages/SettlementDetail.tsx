import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Share2, Trophy, TrendingUp, TrendingDown, Clock, FileCheck, Check, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { ShareModal } from "@/components/ShareModal";
import { SettlementPoster } from "@/components/share";
import { SettlementPriceChart } from "@/components/settlement/SettlementPriceChart";
import { SettlementTimeline } from "@/components/resolved/SettlementTimeline";
import { useSettlementDetail } from "@/hooks/useSettlementDetail";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useReferral } from "@/hooks/useReferral";
import { TRADING_TERMS } from "@/lib/tradingTerms";
import { getBinaryOutcome } from "@/lib/eventUtils";
import { ProductLineBadge } from "@/lib/productLineBadge";
import { format, formatDistanceStrict } from "date-fns";

export default function SettlementDetail() {
  const { settlementId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch user profile and referral code for share card
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const { referralCode } = useReferral();

  // Fetch real settlement data
  const { data: settlement, isLoading, error } = useSettlementDetail({ settlementId });

  const isWin = settlement?.result === "win";
  const isLong = settlement?.side === "long";

  // Calculate P&L breakdown with leverage
  const pnlBreakdown = useMemo(() => {
    if (!settlement) return { 
      margin: 0, 
      positionValue: 0,
      avgEntryPrice: 0, 
      entryCost: 0, 
      exitValue: 0, 
      grossPnl: 0, 
      fundingFee: 0,
      tradingFee: 0, 
      netPnl: 0,
      leveragedPnl: 0,
      roi: 0,
    };
    
    const avgEntryPrice = settlement.trades.length > 0 && settlement.size > 0
      ? settlement.trades.reduce((sum, t) => sum + t.price * t.qty, 0) / settlement.size
      : settlement.entryPrice;
    
    // Margin is the actual capital invested
    const margin = settlement.margin;
    // Position value = margin × leverage
    const positionValue = margin * settlement.leverage;
    
    // Entry and exit based on position size
    const entryCost = settlement.size * avgEntryPrice;
    const exitValue = settlement.size * settlement.exitPrice;
    
    // Gross P&L (before fees)
    const grossPnl = isLong ? exitValue - entryCost : entryCost - exitValue;
    
    // Funding fee: 0.01% per 8 hours of holding
    const holdingHours = (new Date(settlement.settledAt).getTime() - new Date(settlement.openedAt).getTime()) / (1000 * 60 * 60);
    const fundingPeriods = Math.floor(holdingHours / 8);
    const fundingRate = 0.0001; // 0.01% per 8h
    const fundingFee = positionValue * fundingRate * fundingPeriods;
    
    // Trading fees
    const tradingFee = settlement.fee;
    
    // Total fees
    const totalFees = fundingFee + tradingFee;
    
    // Net P&L
    const netPnl = grossPnl - totalFees;
    
    // ROI based on margin (actual capital)
    const roi = margin > 0 ? (netPnl / margin) * 100 : 0;
    
    return {
      margin,
      positionValue,
      avgEntryPrice,
      entryCost,
      exitValue,
      grossPnl,
      fundingFee,
      tradingFee,
      netPnl,
      leveragedPnl: netPnl,
      roi,
      holdingHours,
      fundingPeriods,
    };
  }, [settlement, isLong]);

  // Duration calculation
  const duration = useMemo(() => {
    if (!settlement) return "";
    return formatDistanceStrict(new Date(settlement.settledAt), new Date(settlement.openedAt));
  }, [settlement]);

  // Generate certificate ID
  const certificateId = useMemo(() => {
    if (!settlement) return "";
    const dateStr = format(new Date(settlement.settledAt), "yyMMdd");
    return `STL_${dateStr}_${settlement.id.substring(0, 6).toUpperCase()}`;
  }, [settlement]);

  const handleBack = () => {
    navigate("/portfolio/settlements");
  };

  // Loading state
  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: "hsl(222 47% 6%)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-muted-foreground text-sm">Loading settlement...</span>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !settlement) {
    return (
      <div 
        className={`min-h-screen ${isMobile ? "pb-24" : ""}`}
        style={{ background: "hsl(222 47% 6%)" }}
      >
        {isMobile ? (
          <MobileHeader showBack backTo="/portfolio/settlements" showLogo={false} title="Settlement Detail" />
        ) : (
          <EventsDesktopHeader />
        )}
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="text-muted-foreground text-center">
            <p className="text-lg font-medium mb-2">Settlement not found</p>
            <p className="text-sm">This settlement may not exist or you don't have access to it.</p>
          </div>
          <Button variant="outline" onClick={handleBack}>
            Back to Portfolio
          </Button>
        </div>
        {isMobile && <BottomNav />}
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen ${isMobile ? "pb-24" : ""}`}
      style={{
        background: isMobile 
          ? "hsl(222 47% 6%)" 
          : "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(260 50% 15% / 0.3) 0%, hsl(222 47% 6%) 70%)"
      }}
    >
      {/* Header */}
      {isMobile ? (
        <MobileHeader 
          showBack
          backTo="/portfolio/settlements"
          showLogo={false}
          title="Settlement Detail"
          rightContent={
            <button
              onClick={() => setShowShareModal(true)}
              className="h-9 w-9 flex items-center justify-center transition-all duration-200 active:scale-95"
            >
              <Share2 className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </button>
          }
        />
      ) : (
        <EventsDesktopHeader />
      )}

      <main className={`${isMobile ? "px-4 py-6" : "px-8 py-10 max-w-4xl mx-auto"} space-y-6`}>
        {/* Core Info Card */}
        <div className={`bg-card rounded-2xl ${isMobile ? "p-4" : "p-6"} relative overflow-hidden`}>
          {/* Background glow for win */}
          {isWin && (
            <div className="absolute top-0 right-0 w-48 h-48 bg-trading-green/10 rounded-full blur-3xl" />
          )}
          
          <div className="relative">
            {/* Event Title & Share Button */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className={`font-bold text-foreground leading-tight ${isMobile ? "text-lg" : "text-xl"} flex-1`}>
                  {settlement.event}
                </h1>
                {!isMobile && (
                  <Button variant="outline" size="sm" onClick={() => setShowShareModal(true)} className="gap-2 shrink-0">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                )}
              </div>
              
              {/* Position Info: Side / Leverage / Option */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
                {/* Side Badge — multi-outcome only; binary 单 market 由 Option 行的 outcome 颜色承载方向 */}
                {!getBinaryOutcome(settlement.option) && (
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${isLong
                      ? "border-trading-green/50 text-trading-green bg-trading-green/10"
                      : "border-trading-red/50 text-trading-red bg-trading-red/10"
                    }`}
                  >
                    {isLong ? "Yes" : "No"}
                  </Badge>
                )}

                {/* Leverage (futures only) / SPOT badge (spot) */}
                {settlement.productLine === "spot" ? (
                  <ProductLineBadge line="spot" className="shrink-0" />
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground">Leverage</span>
                    <span className="text-sm font-medium text-foreground">{settlement.leverage}x</span>
                  </div>
                )}

                {/* Option */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs text-muted-foreground shrink-0">Option</span>
                  {(() => {
                    const o = getBinaryOutcome(settlement.option);
                    const cls = o === "yes" ? "text-trading-green" : o === "no" ? "text-trading-red" : "text-foreground";
                    return <span className={`text-sm font-medium truncate ${cls}`}>{settlement.option}</span>;
                  })()}
                </div>
              </div>
            </div>

            {/* Result & P&L */}
            <div className={`flex items-center justify-between p-4 rounded-xl ${
              isWin ? "bg-trading-green/10 border border-trading-green/30" : "bg-trading-red/10 border border-trading-red/30"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isWin ? "bg-trading-green/20" : "bg-trading-red/20"}`}>
                  {isWin ? <Trophy className="w-5 h-5 text-trading-green" /> : <TrendingDown className="w-5 h-5 text-trading-red" />}
                </div>
                <div>
                  <span className={`text-xs uppercase tracking-wide ${isWin ? "text-trading-green/80" : "text-trading-red/80"}`}>
                    {isWin ? "You Won!" : "You Lost"}
                  </span>
                  <div className={`font-mono font-bold ${isMobile ? "text-xl" : "text-2xl"} ${isWin ? "text-trading-green" : "text-trading-red"}`}>
                    {settlement.pnl >= 0 ? "+" : ""}${Math.abs(settlement.pnl).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className={`text-right font-mono ${isWin ? "text-trading-green" : "text-trading-red"}`}>
                <span className="text-lg font-bold">
                  {settlement.pnlPercent >= 0 ? "+" : ""}{settlement.pnlPercent.toFixed(1)}%
                </span>
                <div className="text-xs opacity-70">ROI</div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className={`bg-card rounded-2xl ${isMobile ? "p-4" : "p-6"}`}>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Price History
          </h2>
          <SettlementPriceChart 
            priceHistory={settlement.priceHistory}
            entryPrice={pnlBreakdown.avgEntryPrice}
            exitPrice={settlement.exitPrice}
            trades={settlement.trades}
            isMobile={isMobile}
          />
        </div>

        {/* P&L Breakdown */}
        <div className={`bg-card rounded-2xl ${isMobile ? "p-4" : "p-6"}`}>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            P&L Breakdown
          </h2>
          
          <div className="space-y-3">
            {/* Margin (Actual Investment) */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-muted-foreground text-sm">Margin</span>
                <span className="text-xs text-muted-foreground ml-2">(Your Capital)</span>
              </div>
              <span className="font-mono text-foreground">${pnlBreakdown.margin.toFixed(2)}</span>
            </div>
            
            {/* Position Value — futures only (spot has no leverage multiplier) */}
            {settlement.productLine !== "spot" && (
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-muted-foreground text-sm">Position Value</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (${pnlBreakdown.margin.toFixed(2)} × {settlement.leverage}x)
                  </span>
                </div>
                <span className="font-mono text-foreground">${pnlBreakdown.positionValue.toFixed(2)}</span>
              </div>
            )}
            
            {/* Divider */}
            <div className="border-t border-border/50" />
            
            {/* Entry Cost */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-muted-foreground text-sm">Entry Cost</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({settlement.size.toLocaleString()} × ${pnlBreakdown.avgEntryPrice.toFixed(4)})
                </span>
              </div>
              <span className="font-mono text-trading-red">-${pnlBreakdown.entryCost.toFixed(2)}</span>
            </div>
            
            {/* Exit Value */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-muted-foreground text-sm">Exit Value</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({settlement.size.toLocaleString()} × ${settlement.exitPrice.toFixed(4)})
                </span>
              </div>
              <span className="font-mono text-trading-green">+${pnlBreakdown.exitValue.toFixed(2)}</span>
            </div>
            
            {/* Divider */}
            <div className="border-t border-border/50" />
            
            {/* Gross P&L */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Gross P&L</span>
              <span className={`font-mono ${pnlBreakdown.grossPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                {pnlBreakdown.grossPnl >= 0 ? "+" : ""}${pnlBreakdown.grossPnl.toFixed(2)}
              </span>
            </div>
            
            {/* Funding Fee — futures only (spot never pays funding) */}
            {settlement.productLine !== "spot" && (
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-muted-foreground text-sm">Funding Fee</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (0.01%/8h × {pnlBreakdown.fundingPeriods || 0} periods)
                  </span>
                </div>
                <span className="font-mono text-trading-red">
                  {pnlBreakdown.fundingFee > 0 ? `-$${pnlBreakdown.fundingFee.toFixed(2)}` : "$0.00"}
                </span>
              </div>
            )}
            
            {/* Trading Fee */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Trading Fees</span>
              <span className="font-mono text-trading-red">-${pnlBreakdown.tradingFee.toFixed(2)}</span>
            </div>
            
            {/* Divider */}
            <div className="border-t border-border" />
            
            {/* Net Profit */}
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold">Net Profit</span>
                <span className={`text-xs ml-2 ${pnlBreakdown.roi >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                  ({pnlBreakdown.roi >= 0 ? "+" : ""}{pnlBreakdown.roi.toFixed(1)}% ROI)
                </span>
              </div>
              <span className={`font-mono font-bold text-lg ${pnlBreakdown.netPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                {pnlBreakdown.netPnl >= 0 ? "+" : ""}${pnlBreakdown.netPnl.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Settlement Progress Timeline */}
        <div className={`bg-card rounded-2xl ${isMobile ? "p-4" : "p-6"}`}>
          <h2 className="font-semibold text-foreground mb-6">Settlement Progress</h2>
          <SettlementTimeline 
            startDate={settlement.openedAt}
            endDate={null}
            settledAt={settlement.settledAt}
            variant="compact"
          />
        </div>

        {/* Settlement Certificate */}
        <div className={`bg-card rounded-2xl ${isMobile ? "p-4" : "p-6"} border border-border/50`}>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-muted-foreground" />
            Settlement Certificate
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Certificate ID</span>
              <span className="font-mono text-sm">{certificateId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Settlement Time</span>
              <span className="text-sm">{format(new Date(settlement.settledAt), "MMM d, yyyy HH:mm:ss")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Verification Status</span>
              <div className="flex items-center gap-1.5 text-trading-green">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade History - Always expanded, at the bottom */}
        <div className={`bg-card rounded-2xl ${isMobile ? "p-4" : "p-6"}`}>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Trade History
            <Badge variant="secondary" className="text-xs">{settlement.trades.length}</Badge>
          </h2>
          
          <div className="space-y-0">
            {/* Table Header */}
            <div className={`grid ${isMobile ? "grid-cols-4" : "grid-cols-5"} gap-2 text-xs text-muted-foreground pb-2 border-b border-border`}>
              <span>{TRADING_TERMS.TIME}</span>
              <span>{TRADING_TERMS.ACTION}</span>
              <span className="text-right">{TRADING_TERMS.QTY}</span>
              <span className="text-right">{TRADING_TERMS.PRICE}</span>
              {!isMobile && <span className="text-right">{TRADING_TERMS.TOTAL}</span>}
            </div>
            
            {/* Table Rows */}
            {settlement.trades.map((trade, idx) => (
              <div 
                key={trade.id} 
                className={`grid ${isMobile ? "grid-cols-4" : "grid-cols-5"} gap-2 py-3 text-sm ${
                  idx !== settlement.trades.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <span className="text-muted-foreground text-xs">
                  {format(new Date(trade.time), isMobile ? "MM/dd HH:mm" : "MMM dd, HH:mm")}
                </span>
                <span className={trade.action === "Open" ? "text-trading-green font-medium" : "text-primary font-medium"}>
                  {trade.action}
                </span>
                <span className="text-right font-mono">{trade.qty.toLocaleString()}</span>
                <span className="text-right font-mono">${trade.price.toFixed(3)}</span>
                {!isMobile && <span className="text-right font-mono">${trade.total.toLocaleString()}</span>}
              </div>
            ))}
          </div>
        </div>
      </main>

      {isMobile && <BottomNav />}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={isWin ? "Share Your Win 🏆" : "Share Your Trade"}
        subtitle={isWin ? "Show off your trading success" : "We go again next time!"}
        shareText={`I just ${isWin ? "won" : "lost"} ${settlement.pnlPercent >= 0 ? "+" : ""}${settlement.pnlPercent.toFixed(1)}% on OMENX! ${isWin ? "🚀" : "💀"}`}
        shareUrl={`https://omenx.com/settlement/${settlementId}`}
        fileName={`omenx-settlement-${settlementId}`}
        isDataReady={!isProfileLoading && !!profile}
      >
        <SettlementPoster
          event={settlement.event}
          option={settlement.option}
          side={settlement.side}
          result={settlement.result}
          pnl={settlement.pnl}
          pnlPercent={settlement.pnlPercent}
          entryPrice={pnlBreakdown.avgEntryPrice}
          exitPrice={settlement.exitPrice}
          leverage={settlement.leverage}
          productLine={settlement.productLine}
          settledAt={settlement.settledAt}
          username={profile?.username || "Trader"}
          avatarUrl={profile?.avatar_url || undefined}
          referralCode={referralCode || "OMENX2025"}
          sideLabels={settlement.sideLabels}
        />
      </ShareModal>
    </div>
  );
}
