import { useState, useMemo } from "react";
import { ChevronDown, Plus, ArrowLeftRight, ChevronUp, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePositions } from "@/hooks/usePositions";

import { classifyOrderIntent, getIntentLabel } from "@/lib/positionIntent";
import { TradeSubmitButton } from "@/components/trading/TradeSubmitButton";

interface TradeFormProps {
  selectedPrice?: string;
  eventName?: string;
  optionLabel?: string;
  /** 当前事件的所有选项，用于判断是否为二元事件 */
  eventOptions?: { label: string }[];
  /** 受控 side：传入则由父组件管理，用于与 OrderBook 联动 */
  side?: "buy" | "sell";
  onSideChange?: (next: "buy" | "sell") => void;
  /**
   * 单 market binary 模式：传入后，Yes/No 按钮变成 option 切换器，
   * 点击 No 不再翻转 side，而是切换 selectedOption 到 No 端的 long 仓位入口。
   */
  binaryMode?: {
    yesLabel: string;
    noLabel: string;
    yesPrice: number;
    noPrice: number;
    isYesSelected: boolean;
    onSelectYes: () => void;
    onSelectNo: () => void;
  };
  /** binary 单 market 事件的两端别名（如体育队名），用于提交按钮等文案翻译 */
  sideLabels?: { yes: string; no: string } | null;
}


export const TradeForm = ({ 
  selectedPrice = "0.1234", 
  eventName = "Elon Musk # tweets December 12 - December 19, 2025?",
  optionLabel = "200-219",
  eventOptions = [],
  side: controlledSide,
  onSideChange,
  binaryMode,
  sideLabels,
}: TradeFormProps) => {
  const navigate = useNavigate();
  const { balance } = useUserProfile();
  const { positions } = usePositions();

  
  
  const [internalSide, setInternalSide] = useState<"buy" | "sell">("buy");
  const side = controlledSide ?? internalSide;
  const setSide = (next: "buy" | "sell") => {
    if (controlledSide === undefined) setInternalSide(next);
    onSideChange?.(next);
  };
  const [marginType, setMarginType] = useState("Cross");
  const [leverage, setLeverage] = useState(10);
  const [orderType, setOrderType] = useState("Market");
  const [amount, setAmount] = useState("0.00");
  const [sliderValue, setSliderValue] = useState([0]);
  const [tpsl, setTpsl] = useState(false);
  const [inputMode, setInputMode] = useState<"amount" | "qty">("amount");
  
  // TP/SL states
  const [tpMode, setTpMode] = useState<"pct" | "price">("pct");
  const [slMode, setSlMode] = useState<"pct" | "price">("pct");
  const [tpValue, setTpValue] = useState("");
  const [slValue, setSlValue] = useState("");

  const available = balance;
  const feeRate = 0.0005; // 0.05% trading fee
  const longPrice = parseFloat(selectedPrice);
  const shortPrice = +(1 - longPrice).toFixed(4);
  // Side-specific execution price (Buy = Yes, Sell = No)
  const currentPrice = side === "buy" ? longPrice : shortPrice;

  // Calculate TP/SL prices based on percentage
  const tpslCalculations = useMemo(() => {
    const tpPct = parseFloat(tpValue) || 0;
    const slPct = parseFloat(slValue) || 0;
    
    let tpPrice = 0;
    let slPrice = 0;
    
    if (tpMode === "pct") {
      // For buy: TP is above current price
      // For sell: TP is below current price
      tpPrice = side === "buy" 
        ? currentPrice * (1 + tpPct / 100)
        : currentPrice * (1 - tpPct / 100);
    } else {
      tpPrice = parseFloat(tpValue) || 0;
    }
    
    if (slMode === "pct") {
      // For buy: SL is below current price
      // For sell: SL is above current price
      slPrice = side === "buy"
        ? currentPrice * (1 - slPct / 100)
        : currentPrice * (1 + slPct / 100);
    } else {
      slPrice = parseFloat(slValue) || 0;
    }
    
    // Calculate estimated PnL
    const amountValue = parseFloat(amount) || 0;
    const notionalValue = amountValue * leverage;
    const quantity = currentPrice > 0 ? notionalValue / currentPrice : 0;
    
    const tpPnL = side === "buy"
      ? (tpPrice - currentPrice) * quantity
      : (currentPrice - tpPrice) * quantity;
    
    const slPnL = side === "buy"
      ? (slPrice - currentPrice) * quantity
      : (currentPrice - slPrice) * quantity;
    
    return {
      tpPrice: tpPrice.toFixed(4),
      slPrice: slPrice.toFixed(4),
      tpPnL: tpPnL.toFixed(2),
      slPnL: slPnL.toFixed(2),
    };
  }, [tpValue, slValue, tpMode, slMode, side, currentPrice, amount, leverage]);

  // Calculate order values based on amount and leverage
  const orderCalculations = useMemo(() => {
    const amountValue = parseFloat(amount) || 0;
    const price = currentPrice;

    // Notional value = amount * leverage
    const notionalValue = amountValue * leverage;

    // Margin required = amount (same as input)
    const marginRequired = amountValue;

    // Estimated fee = notional value * fee rate
    const estimatedFee = notionalValue * feeRate;

    // Total = margin required + fee
    const total = marginRequired + estimatedFee;

    // Quantity = notional value / price
    const quantity = price > 0 ? notionalValue / price : 0;

    // Potential win = (1 - price) * quantity (if outcome resolves in user's favor)
    const potentialWin = (1 - price) * quantity;

    // Estimated liquidation price - sell side moves opposite direction
    const liqPrice = price > 0
      ? (side === "buy"
          ? price * (1 - 1 / leverage * 0.9)
          : price * (1 + 1 / leverage * 0.9)
        ).toFixed(4)
      : "0.0000";

    return {
      notionalValue: notionalValue.toFixed(2),
      marginRequired: marginRequired.toFixed(2),
      estimatedFee: estimatedFee.toFixed(2),
      total: total.toFixed(2),
      quantity: quantity.toFixed(0),
      potentialWin: potentialWin.toFixed(0),
      liqPrice,
    };
  }, [amount, leverage, currentPrice, side]);

  const orderIntent = useMemo(() => classifyOrderIntent({
    positions,
    eventName,
    optionLabel,
    side,
    quantity: parseFloat(orderCalculations.quantity) || 0,
    clickedPrice: currentPrice,
    leverage,
  }), [positions, eventName, optionLabel, side, orderCalculations.quantity, currentPrice, leverage]);

  const displayCalculations = useMemo(() => {
    const estimatedFee = orderIntent.tradedNotional * feeRate;
    const total = orderIntent.incrementalMargin + estimatedFee;
    return {
      ...orderCalculations,
      notionalValue: orderIntent.tradedNotional.toFixed(2),
      marginRequired: orderIntent.incrementalMargin.toFixed(2),
      estimatedFee: estimatedFee.toFixed(2),
      total: total.toFixed(2),
    };
  }, [orderCalculations, orderIntent.tradedNotional, orderIntent.incrementalMargin]);

  const handlePreview = () => {
    if (orderIntent.kind === "blocked-cross-zero") return;
    navigate("/order-preview", {
      state: {
        side,
        marginType,
        leverage: `${leverage}x`,
        orderType,
        amount,
        price: currentPrice.toFixed(4),
        event: eventName,
        option: optionLabel,
        sideLabels: sideLabels ?? null,
        orderCalculations: displayCalculations,
        tpsl: tpsl ? {
          tp: tpValue ? { value: tpValue, mode: tpMode, price: tpslCalculations.tpPrice } : null,
          sl: slValue ? { value: slValue, mode: slMode, price: tpslCalculations.slPrice } : null,
        } : null,
      },
    });
  };

  return (
    <div className="px-3 pb-2 space-y-2">
      {/* Yes/No Toggle — binary 单 market 下点击切换 option（联动 K 线/订单簿），否则切换 side */}
      {/* 双层结构：上层 label（队名/Yes/No），下层独立色块价格条 */}
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-lg">
          {(() => {
            const yesActive = binaryMode ? binaryMode.isYesSelected : side === "buy";
            const noActive = binaryMode ? !binaryMode.isYesSelected : side === "sell";
            const yesLabel = binaryMode?.yesLabel ?? "Yes";
            const noLabel = binaryMode?.noLabel ?? "No";
            const yesPriceVal = (binaryMode?.yesPrice ?? longPrice).toFixed(4);
            const noPriceVal = (binaryMode?.noPrice ?? shortPrice).toFixed(4);
            return (
              <>
                <button
                  onClick={() => (binaryMode ? binaryMode.onSelectYes() : setSide("buy"))}
                  className="relative flex flex-col h-full rounded-md overflow-hidden transition-all duration-200"
                >
                  <div
                    className={`relative flex-1 flex items-center justify-center min-h-[24px] py-1.5 px-2 ${
                      yesActive
                        ? "bg-trading-green text-trading-green-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span className="text-[11px] font-semibold leading-tight line-clamp-2 text-center">
                      {yesLabel}
                    </span>
                    {yesActive && (
                      <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-current shadow-[0_0_4px_currentColor]" />
                    )}
                  </div>
                  <div
                    className={`h-[22px] flex items-center justify-center border-t ${
                      yesActive
                        ? "bg-trading-green/85 text-trading-green-foreground border-black/20"
                        : "bg-muted-foreground/15 text-foreground/80 border-border/40"
                    }`}
                  >
                    <span className="text-[11px] font-mono">{yesPriceVal}</span>
                  </div>
                </button>
                <button
                  onClick={() => (binaryMode ? binaryMode.onSelectNo() : setSide("sell"))}
                  className="relative flex flex-col h-full rounded-md overflow-hidden transition-all duration-200"
                >
                  <div
                    className={`relative flex-1 flex items-center justify-center min-h-[24px] py-1.5 px-2 ${
                      noActive
                        ? "bg-trading-red text-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span className="text-[11px] font-semibold leading-tight line-clamp-2 text-center">
                      {noLabel}
                    </span>
                    {noActive && (
                      <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-current shadow-[0_0_4px_currentColor]" />
                    )}
                  </div>
                  <div
                    className={`h-[22px] flex items-center justify-center border-t ${
                      noActive
                        ? "bg-trading-red/85 text-foreground border-black/20"
                        : "bg-muted-foreground/15 text-foreground/80 border-border/40"
                    }`}
                  >
                    <span className="text-[11px] font-mono">{noPriceVal}</span>
                  </div>
                </button>
              </>
            );
          })()}
        </div>
      </div>



      {/* Margin & Leverage */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Margin / LVG</span>
        <button className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
          {marginType}
          <ChevronDown className="w-3 h-3" />
        </button>
        <button className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
          {leverage}x
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Available Balance */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Available (USDC)</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{available.toLocaleString()}</span>
          <button 
            onClick={() => navigate('/deposit')}
            className="w-5 h-5 bg-muted rounded-full flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Order Type */}
      <div className="space-y-0.5">
        <span className="text-[10px] text-muted-foreground">Order type</span>
        <button className="w-full flex items-center justify-between px-2.5 py-2 bg-muted rounded-lg text-xs">
          <span>{orderType}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Amount/Qty Input */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">
            {inputMode === "amount" ? "Amount" : "Qty"}
          </span>
          <button 
            onClick={() => setInputMode(inputMode === "amount" ? "qty" : "amount")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono text-xs"
            placeholder="0.00"
          />
          {inputMode === "amount" && (
            <span className="text-muted-foreground text-[10px] font-medium">USDC</span>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-1">
        <Slider
          value={sliderValue}
          onValueChange={(val) => {
            setSliderValue(val);
            setAmount((available * val[0] / 100).toFixed(2));
          }}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          {["0%", "25%", "50%", "75%", "100%"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>

      {/* TP/SL Section - Simple Dropdown Style */}
      <div className="space-y-2">
        <button 
          onClick={() => setTpsl(!tpsl)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${tpsl ? 'bg-trading-purple border-trading-purple' : 'border-muted-foreground'}`}>
              {tpsl && <span className="text-[10px] text-foreground">✓</span>}
            </div>
            <span className="text-xs text-muted-foreground">TP/SL</span>
          </div>
          {tpsl ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        
        {tpsl && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Take Profit */}
            <div className="space-y-1.5">
              <span className="text-xs text-trading-green">Take Profit</span>
              <div className="flex items-center bg-muted rounded-lg px-3 py-2.5 gap-1">
                <input
                  type="text"
                  value={tpValue}
                  onChange={(e) => setTpValue(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent outline-none font-mono text-sm"
                  placeholder={tpMode === "pct" ? "0" : "0.0000"}
                />
                <div className="flex bg-background/50 rounded p-0.5 shrink-0">
                  <button
                    onClick={() => setTpMode("pct")}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      tpMode === "pct" ? "bg-trading-green/20 text-trading-green" : "text-muted-foreground"
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setTpMode("price")}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      tpMode === "price" ? "bg-trading-green/20 text-trading-green" : "text-muted-foreground"
                    }`}
                  >
                    $
                  </button>
                </div>
              </div>
              {tpValue && tpMode === "pct" && (
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Target: ${tpslCalculations.tpPrice}</span>
                  <span className="text-trading-green">+${tpslCalculations.tpPnL}</span>
                </div>
              )}
            </div>

            {/* Stop Loss */}
            <div className="space-y-1.5">
              <span className="text-xs text-trading-red">Stop Loss</span>
              <div className="flex items-center bg-muted rounded-lg px-3 py-2.5 gap-1">
                <input
                  type="text"
                  value={slValue}
                  onChange={(e) => setSlValue(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent outline-none font-mono text-sm"
                  placeholder={slMode === "pct" ? "0" : "0.0000"}
                />
                <div className="flex bg-background/50 rounded p-0.5 shrink-0">
                  <button
                    onClick={() => setSlMode("pct")}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      slMode === "pct" ? "bg-trading-red/20 text-trading-red" : "text-muted-foreground"
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setSlMode("price")}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      slMode === "price" ? "bg-trading-red/20 text-trading-red" : "text-muted-foreground"
                    }`}
                  >
                    $
                  </button>
                </div>
              </div>
              {slValue && slMode === "pct" && (
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Target: ${tpslCalculations.slPrice}</span>
                  <span className="text-trading-red">{tpslCalculations.slPnL}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Notional val.</span>
          <span className={parseFloat(amount) > 0 ? "text-foreground font-mono" : "text-muted-foreground"}>
            {parseFloat(amount) > 0 ? `${displayCalculations.notionalValue} USDC` : "--"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Margin req.</span>
          <span className={parseFloat(amount) > 0 ? "text-foreground font-mono" : "text-muted-foreground"}>
            {parseFloat(amount) > 0 ? `${displayCalculations.marginRequired} USDC` : "--"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fee (est.)</span>
          <span className={parseFloat(amount) > 0 ? "text-foreground font-mono" : "text-muted-foreground"}>
            {parseFloat(amount) > 0 ? `${displayCalculations.estimatedFee} USDC` : "--"}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-border/30">
          <span className="font-medium text-foreground">Total</span>
          <span className={parseFloat(amount) > 0 ? "text-foreground font-mono font-medium" : "text-muted-foreground"}>
            {parseFloat(amount) > 0 ? `${displayCalculations.total} USDC` : "--"}
          </span>
        </div>
      </div>


      {orderIntent.kind === "blocked-cross-zero" && (
        <div className="space-y-2 rounded-lg border border-trading-red/30 bg-trading-red/10 px-3 py-2 text-[11px] text-trading-red">
          <p>You hold {orderIntent.existingQty.toLocaleString()} {orderIntent.existingPosition?.type} shares. Close it before opening the opposite side.</p>
          <button
            type="button"
            onClick={() => setAmount(((orderIntent.existingQty * currentPrice) / leverage).toFixed(2))}
            className="text-foreground underline underline-offset-2"
          >
            Close & Continue
          </button>
        </div>
      )}

      {/* Submit Button */}
      <TradeSubmitButton
        side={side}
        label={getIntentLabel(orderIntent, side, sideLabels)}
        potentialWin={parseFloat(amount) > 0 ? parseInt(orderCalculations.potentialWin).toLocaleString() : "0"}
        onClick={handlePreview}
        disabled={orderIntent.kind === "blocked-cross-zero"}
        size="sm"
      />
    </div>
  );
};