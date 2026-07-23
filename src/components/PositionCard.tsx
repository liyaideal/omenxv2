import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Pencil, Gift, Lock } from "lucide-react";
import { MobileDrawer, MobileDrawerActions } from "@/components/ui/mobile-drawer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TRADING_TERMS } from "@/lib/tradingTerms";
import { calcLiqPrice } from "@/lib/tradingUtils";
import { getBinaryOutcome } from "@/lib/eventUtils";
import { useRealtimePositionsPnL } from "@/hooks/useRealtimePositionsPnL";
import { usePositions, type UnifiedPosition } from "@/hooks/usePositions";
import { ClosePositionDrawer } from "@/components/positions/ClosePositionDrawer";
import { CloseVoucherDrawer } from "@/components/positions/CloseVoucherDrawer";
import { PositionDetailDrawer } from "@/components/positions/PositionDetailDrawer";

interface PositionCardProps {
  type: "long" | "short";
  event: string;
  option: string;
  /** Display label after applying sideLabels; falls back to option. */
  displayOption?: string;
  optionId?: string | null;
  entryPrice: string;
  markPrice: string;
  size: string;
  sizeDisplay?: string;
  margin: string;
  pnl: string;
  pnlPercent: string;
  leverage: string;
  takeProfit?: string;
  stopLoss?: string;
  isAirdrop?: boolean;
  // Identity for close mutations (passed by parent list)
  positionId?: string;
  positionIndex?: number;
  // Full unified position (enables detail drawer with funding data)
  position?: UnifiedPosition;
}

export const PositionCard = ({
  type,
  event,
  option,
  displayOption,
  optionId,
  entryPrice,
  markPrice,
  size,
  sizeDisplay,
  margin,
  pnl,
  pnlPercent,
  leverage,
  takeProfit: initialTp = "",
  stopLoss: initialSl = "",
  isAirdrop,
  positionId,
  positionIndex,
  position: fullPosition,
}: PositionCardProps) => {
  const optionDisplay = displayOption ?? option;
  // 当 displayOption 已经是 binary 别名（如 "Alex Pereira"），option 原值是 "Yes"/"No"，
  // 再渲染一个 Yes/No 侧别 chip 就是重复信息 → 隐藏。
  const outcome = getBinaryOutcome(option);
  const isBinaryAlias = displayOption !== undefined && displayOption !== option && outcome !== null;
  // Yes/No 颜色看 outcome（option_label），不看 type；多 outcome 才回退到 type-driven 配色
  const outcomeColorBg = outcome === "yes"
    ? "bg-trading-green/20 text-trading-green"
    : outcome === "no"
    ? "bg-trading-red/20 text-trading-red"
    : type === "long"
    ? "bg-trading-green/20 text-trading-green"
    : "bg-trading-red/20 text-trading-red";
  const outcomeColorText = outcome === "yes"
    ? "text-trading-green"
    : outcome === "no"
    ? "text-trading-red"
    : type === "long"
    ? "text-trading-green"
    : "text-trading-red";
  // 多 outcome 事件：chip 显示方向 Yes/No（long→Yes，short→No）。binary 事件 chip 被隐藏，此值用于 drawer。
  const directionLabel = type === "long" ? "Yes" : "No";
  const outcomeLabel = outcome === "yes" ? "Yes" : outcome === "no" ? "No" : directionLabel;
  // Calculate real-time P&L using live market prices
  const { calculateRealtimePnL } = useRealtimePositionsPnL();
  
  // Always attempt realtime calc — calculateRealtimePnL will fall back to
  // event/option name matching when optionId is missing (matches desktop behavior).
  const realtimeData = useMemo(() => {
    return calculateRealtimePnL({
      event,
      option,
      optionId,
      type,
      entryPrice,
      size,
      margin,
    });
  }, [optionId, event, option, type, entryPrice, size, margin, calculateRealtimePnL]);
  
  // Use realtime values if available, otherwise fall back to props
  const displayPnl = realtimeData?.hasRealtimePrice 
    ? `${realtimeData.pnl >= 0 ? "+" : ""}$${Math.abs(realtimeData.pnl).toFixed(2)}`
    : pnl;
  const displayPnlPercent = realtimeData?.hasRealtimePrice
    ? `${realtimeData.pnlPercent >= 0 ? "+" : ""}${realtimeData.pnlPercent.toFixed(1)}%`
    : pnlPercent;
  const displayMarkPrice = realtimeData?.hasRealtimePrice
    ? `$${realtimeData.markPrice.toFixed(4)}`
    : markPrice;
  
  const isProfitable = realtimeData?.hasRealtimePrice
    ? realtimeData.pnl >= 0
    : !pnl.startsWith("-");
  
  const [tpSlOpen, setTpSlOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  // Use saved state to persist values after dialog closes
  const [savedTp, setSavedTp] = useState(initialTp);
  const [savedSl, setSavedSl] = useState(initialSl);
  const [savedTpMode, setSavedTpMode] = useState<"%" | "$">("$");
  const [savedSlMode, setSavedSlMode] = useState<"%" | "$">("$");
  const [tpValue, setTpValue] = useState(initialTp);
  const [slValue, setSlValue] = useState(initialSl);
  const [tpMode, setTpMode] = useState<"%" | "$">("$");
  const [slMode, setSlMode] = useState<"%" | "$">("$");
  const { toast } = useToast();

  const { partialClosePosition, closePosition, isClosing } = usePositions();

  const isVoucher = isAirdrop && fullPosition?.airdropSource === "voucher";

  const handleClosePartial = async (qty: number) => {
    if (!positionId || positionIndex === undefined) {
      toast({ title: "Position Closed", description: `Your ${type} position on ${optionDisplay} has been closed.` });
      return;
    }
    await partialClosePosition(positionId, positionIndex, qty);
  };

  const handleCloseVoucher = async () => {
    if (!positionId || positionIndex === undefined) return;
    await closePosition(positionId, positionIndex);
  };

  const handleSave = () => {
    setSavedTp(tpValue);
    setSavedSl(slValue);
    setSavedTpMode(tpMode);
    setSavedSlMode(slMode);
    toast({
      title: "TP/SL Updated",
      description: `Take Profit: ${tpValue ? (tpMode === "%" ? `+${tpValue}%` : `$${tpValue}`) : "Not set"}, Stop Loss: ${slValue ? (slMode === "%" ? `-${slValue}%` : `$${slValue}`) : "Not set"}`,
    });
    setTpSlOpen(false);
  };

  const handleCancel = () => {
    setTpValue(savedTp);
    setSlValue(savedSl);
    setTpMode(savedTpMode);
    setSlMode(savedSlMode);
    setTpSlOpen(false);
  };

  const handleOpenDialog = () => {
    setTpValue(savedTp);
    setSlValue(savedSl);
    setTpMode(savedTpMode);
    setSlMode(savedSlMode);
    setTpSlOpen(true);
  };

  const hasTpSl = savedTp || savedSl;
  
  // Format display with unit
  const formatTpSl = (value: string, mode: "%" | "$", isProfit: boolean) => {
    if (!value) return "";
    if (mode === "%") {
      return isProfit ? `+${value}%` : `-${value}%`;
    }
    return `$${value}`;
  };
  
  // Parse numeric values for calculation
  const parsePrice = (price: string) => {
    return parseFloat(price.replace(/[$,]/g, '')) || 0;
  };
  
  const parsedEntryPrice = parsePrice(entryPrice);
  const parsedMargin = parsePrice(margin);
  const parsedSize = parseFloat(size.replace(/,/g, '')) || 0;
  const leverageNum = parseFloat(leverage.replace('x', '')) || 1;
  
  // Calculate estimated P&L based on TP/SL
  const calculateEstimatedPnl = (value: string, mode: "%" | "$", isProfit: boolean) => {
    if (!value || !parsedMargin) return null;
    const numValue = parseFloat(value) || 0;
    if (numValue === 0) return null;
    
    if (mode === "%") {
      // Percentage mode: PnL = margin * (percentage / 100)
      const pnl = parsedMargin * (numValue / 100) * leverageNum;
      return isProfit ? pnl : -pnl;
    } else {
      // Price mode: Calculate based on price difference
      const targetPrice = numValue;
      if (parsedEntryPrice === 0 || parsedSize === 0) return null;
      const priceDiff = targetPrice - parsedEntryPrice;
      const pnl = type === "long" 
        ? priceDiff * parsedSize 
        : -priceDiff * parsedSize;
      return pnl;
    }
  };
  
  const tpEstimatedPnl = calculateEstimatedPnl(tpValue, tpMode, true);
  const slEstimatedPnl = calculateEstimatedPnl(slValue, slMode, false);
  
  const formatPnl = (pnl: number | null) => {
    if (pnl === null) return "";
    const sign = pnl >= 0 ? "+" : "";
    return `${sign}$${Math.abs(pnl).toFixed(2)}`;
  };

  return (
    <>
      <div className="bg-card rounded-xl p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {!outcome && (
              // 仅多 outcome 事件保留 Buy/Sell 配色 chip；binary 行 outcome 颜色挪到下方主标签
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${outcomeColorBg}`}>
                {outcomeLabel}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{leverage}</span>
            {isAirdrop && (
              <span className="inline-flex items-center gap-0.5 bg-primary/20 text-primary border border-primary/30 text-[9px] font-semibold px-1.5 py-0 rounded">
                <Gift className="w-2.5 h-2.5" />
                AIRDROP
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            isProfitable ? "text-trading-green" : "text-trading-red"
          }`}>
            {isProfitable ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {displayPnl} ({displayPnlPercent})
          </div>
        </div>

        {/* Event Info — tap to open detail drawer */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => fullPosition && setDetailOpen(true)}
            disabled={!fullPosition}
            className="w-full text-left hover:opacity-80 transition-opacity disabled:cursor-default"
          >
            <h3 className="font-medium text-foreground text-sm truncate">{event}</h3>
            <div className="flex items-center gap-2">
              <p className={`text-xs ${outcome ? outcomeColorText : "text-muted-foreground"}`}>
                {optionDisplay}
              </p>
              {fullPosition && (
                <span className="text-[10px] text-primary">Details ›</span>
              )}
            </div>
          </button>
        </div>

        {/* Position Details */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div>
            <span className="text-[10px] text-muted-foreground block">{TRADING_TERMS.QTY}</span>
            <span className="font-mono text-xs">{sizeDisplay || size}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Entry</span>
            <span className="font-mono text-xs">{entryPrice}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Mark</span>
            <span className="font-mono text-xs">{displayMarkPrice}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">{TRADING_TERMS.MARGIN}</span>
            <span className="font-mono text-xs">{margin}</span>
          </div>
        </div>

        {/* Liquidation price — estimated, ignores funding/MM buffer */}
        <div
          className="flex items-center justify-between mb-2"
          title="Estimated, ignores funding and MM buffer"
        >
          <span className="text-[10px] text-muted-foreground">{TRADING_TERMS.LIQ_PRICE}</span>
          <span className="font-mono text-xs text-trading-red">
            {calcLiqPrice(entryPrice, leverage, type)}
          </span>
        </div>

        {/* TP/SL Row - Always visible (hidden for airdrop positions) */}
        {!isAirdrop && (
        <div className="flex items-center justify-between py-2 mb-2 border-y border-border/30">
          <span className="text-[10px] text-muted-foreground">{TRADING_TERMS.TPSL}</span>
          <button 
            onClick={handleOpenDialog}
            className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
          >
            {hasTpSl ? (
              <>
                {savedTp && <span className="text-trading-green font-mono">{formatTpSl(savedTp, savedTpMode, true)}</span>}
                {savedTp && savedSl && <span className="text-muted-foreground">/</span>}
                {savedSl && <span className="text-trading-red font-mono">{formatTpSl(savedSl, savedSlMode, false)}</span>}
              </>
            ) : (
              <span className="text-muted-foreground">--</span>
            )}
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
        )}

        {/* Actions at bottom */}
        {isAirdrop && !isVoucher ? (
          <div className="flex items-center gap-1.5 py-1.5 text-[10px] text-muted-foreground border-t border-border/30 mt-1 pt-2">
            <Lock className="w-3 h-3" />
            <span>Auto-settles on event resolution</span>
          </div>
        ) : isVoucher ? (
          <div className="flex gap-2">
            <button
              onClick={() => setCloseOpen(true)}
              className="flex-1 py-1.5 text-[10px] font-medium bg-trading-red/20 text-trading-red rounded-lg hover:bg-trading-red/30 transition-colors"
            >
              Close position
            </button>
            <CloseVoucherDrawer
              open={closeOpen}
              onOpenChange={setCloseOpen}
              event={event}
              optionLabel={optionDisplay}
              side={type}
              entryPrice={parseFloat(entryPrice.replace(/[$,]/g, "")) || 0}
              markPrice={
                realtimeData?.hasRealtimePrice
                  ? realtimeData.markPrice
                  : parseFloat(markPrice.replace(/[$,]/g, "")) || 0
              }
              faceValue={fullPosition?.voucherFaceValue ?? (parseFloat(margin.replace(/[$,]/g, "")) || 0)}
              redeemableCap={fullPosition?.voucherRedeemableCap ?? null}
              isClosing={isClosing}
              onConfirm={handleCloseVoucher}
            />
          </div>
        ) : (
        <div className="flex gap-2">
          <button 
            onClick={handleOpenDialog}
            className="flex-1 py-1.5 text-[10px] font-medium bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            {hasTpSl ? `Edit ${TRADING_TERMS.TPSL}` : `Add ${TRADING_TERMS.TPSL}`}
          </button>
          <button
            onClick={() => setCloseOpen(true)}
            className="flex-1 py-1.5 text-[10px] font-medium bg-trading-red/20 text-trading-red rounded-lg hover:bg-trading-red/30 transition-colors"
          >
            Close
          </button>
          <ClosePositionDrawer
            open={closeOpen}
            onOpenChange={setCloseOpen}
            option={optionDisplay}
            side={type}
            size={parseFloat(String(size).replace(/,/g, "")) || 0}
            entryPrice={parseFloat(entryPrice.replace(/[$,]/g, "")) || 0}
            markPrice={
              realtimeData?.hasRealtimePrice
                ? realtimeData.markPrice
                : parseFloat(markPrice.replace(/[$,]/g, "")) || 0
            }
            margin={parseFloat(margin.replace(/[$,]/g, "")) || 0}
            fullCloseOnly={isAirdrop}
            isClosing={isClosing}
            onConfirm={handleClosePartial}
          />
        </div>
        )}
      </div>

      {/* TP/SL Edit Drawer (mobile spec) */}
      <MobileDrawer
        open={tpSlOpen}
        onOpenChange={setTpSlOpen}
        title={`Edit ${TRADING_TERMS.TPSL}`}
      >
        <div className="space-y-4">
          {/* Position Info */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Position</span>
              <span className={outcomeColorText}>
                {isBinaryAlias ? optionDisplay : outcomeLabel} {leverage}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{TRADING_TERMS.ENTRY_PRICE}</span>
              <span className="font-mono">{entryPrice}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{TRADING_TERMS.MARK_PRICE}</span>
              <span className="font-mono">{markPrice}</span>
            </div>
          </div>

          {/* Take Profit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-trading-green">Take Profit</label>
              {tpEstimatedPnl !== null && (
                <span className={`text-xs font-mono ${tpEstimatedPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                  Est. P&L: {formatPnl(tpEstimatedPnl)}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={tpValue}
                  onChange={(e) => setTpValue(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 bg-muted border-0 rounded-lg px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex bg-muted rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setTpMode("%")}
                  className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                    tpMode === "%" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  %
                </button>
                <button
                  onClick={() => setTpMode("$")}
                  className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                    tpMode === "$" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  $
                </button>
              </div>
            </div>
          </div>

          {/* Stop Loss */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-trading-red">Stop Loss</label>
              {slEstimatedPnl !== null && (
                <span className={`text-xs font-mono ${slEstimatedPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                  Est. P&L: {formatPnl(slEstimatedPnl)}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={slValue}
                  onChange={(e) => setSlValue(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 bg-muted border-0 rounded-lg px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex bg-muted rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setSlMode("%")}
                  className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                    slMode === "%" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  %
                </button>
                <button
                  onClick={() => setSlMode("$")}
                  className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                    slMode === "$" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  $
                </button>
              </div>
            </div>
          </div>

          <MobileDrawerActions>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 bg-primary hover:bg-primary/90"
                onClick={handleSave}
              >
                Confirm
              </Button>
            </div>
          </MobileDrawerActions>
        </div>
      </MobileDrawer>

      {/* Position Detail Drawer */}
      {fullPosition && (
        <PositionDetailDrawer
          position={fullPosition}
          liveMarkPrice={realtimeData?.hasRealtimePrice ? realtimeData.markPrice : undefined}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </>
  );
};
