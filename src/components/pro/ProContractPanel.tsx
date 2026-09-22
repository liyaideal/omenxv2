// ============================================================
// Pro /trade desktop order panel (CT-D · the 280px right rail).
//
// Extracted verbatim from DesktopTrading (2026-09-21, 交易页收尾) so the
// style guide can mount the REAL panel with fixture props — no hand-copied
// shells (omenx-styleguide-flow 铁律 1). Presentational only: every number,
// label and gate decision is computed by the page and passed in; the panel
// never reads stores or hooks itself.
// ============================================================
import type { MutableRefObject } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AmountUnitDropdown } from "@/components/pro/AmountUnitDropdown";
import type { AmountMode } from "@/stores/useAmountModeStore";
import { TransferEntry } from "@/components/pro/TransferEntry";
import { OrderTypeDropdown, type ProOrderType } from "@/components/pro/OrderTypeDropdown";
import { BinarySideToggle } from "@/components/pro/BinarySideToggle";
import { TradeSubmitButton } from "@/components/trading/TradeSubmitButton";
import { WinTooltipBody } from "@/components/lite/shared/WinTooltipBody";
import type { OrderIntent } from "@/lib/positionIntent";

export interface ProContractPanelProps {
  intent: "buy" | "sell";
  setIntent: (next: "buy" | "sell") => void;
  orderType: ProOrderType;
  setOrderType: (next: ProOrderType) => void;
  /** Yes / No toggle. */
  binaryLabels: { yes: string; no: string };
  yesPrice: number;
  noPrice: number;
  isYesSelected: boolean;
  sellOutcome: "yes" | "no";
  sellDisabledSide: "yes" | "no" | "both" | undefined;
  heldPositions: { yes: unknown; no: unknown };
  onSelectSide: (which: "yes" | "no") => void;
  /** Buy tab. */
  side: "buy" | "sell";
  leverage: number;
  setLeverage: (next: number) => void;
  available: number;
  limitPrice: string;
  setLimitPrice: (next: string) => void;
  sidePrice: number;
  amountMode: AmountMode;
  setAmountMode: (next: AmountMode) => void;
  unitsInput: string;
  setUnitsInput: (next: string) => void;
  amount: string;
  setAmount: (next: string) => void;
  sliderValue: number[];
  setSliderValue: (next: number[]) => void;
  maxUnits: number;
  tpsl: boolean;
  setTpsl: (next: boolean) => void;
  tpValue: string;
  setTpValue: (next: string) => void;
  tpMode: "pct" | "price";
  setTpMode: (next: "pct" | "price") => void;
  slValue: string;
  setSlValue: (next: string) => void;
  slMode: "pct" | "price";
  setSlMode: (next: "pct" | "price") => void;
  tpslCalculations: { tpPrice: string; slPrice: string; tpPnL: string; slPnL: string };
  orderCalculations: { quantity: string; potentialWin: string };
  displayCalculations: { notionalValue: string; marginRequired: string; estimatedFee: string; total: string };
  orderIntent: OrderIntent;
  /** "" when orderable; otherwise the text the CTA shows while disabled (gate reason / Close-only). */
  buyBlockedReason: string;
  buyCtaLabel: string;
  /** 交易页收尾 #1 · Limit below the side price → the order will rest as Pending. */
  buyLimitPending?: boolean;
  /** 交易页收尾 #4 · leverage cap from category_boost_configs; 1 = Boost not available. */
  leverageMax?: number;
  leverageTiers?: number[];
  onPreview: () => void;
  onCloseAndContinue: () => void;
  isBinarySingleMarket: boolean;
  /** Sell tab. */
  heldPos: { leverageNum: number; entryPriceNum: number } | null | undefined;
  heldSize: number;
  sellOutcomeLabel: string;
  sellLimitPrice: string;
  setSellLimitPrice: (next: string) => void;
  sellMark: number;
  sellLimitPending: boolean;
  sellClosePrice: number;
  sellAmountRef?: MutableRefObject<HTMLInputElement | null>;
  sellQtyInput: string;
  setSellQtyInput: (next: string) => void;
  sellSlider: number[];
  setSellSlider: (next: number[]) => void;
  sellQty: number;
  sellReleasedMargin: number;
  sellRealizedPnl: number;
  sellCommission: number;
  sellCashBack: number;
  sellBlockedReason: string;
  sellCtaLabel: string;
  sellSubmitDisabled: boolean;
  onSellPreview: () => void;
}

export const ProContractPanel = (props: ProContractPanelProps) => {
  const {
    intent, setIntent, orderType, setOrderType, binaryLabels, yesPrice, noPrice, isYesSelected, sellOutcome,
    sellDisabledSide, heldPositions, onSelectSide, side, leverage, setLeverage, available, limitPrice, setLimitPrice,
    sidePrice, amountMode, setAmountMode, unitsInput, setUnitsInput, amount, setAmount, sliderValue, setSliderValue,
    maxUnits, tpsl, setTpsl, tpValue, setTpValue, tpMode, setTpMode, slValue, setSlValue, slMode, setSlMode,
    tpslCalculations, orderCalculations, displayCalculations, orderIntent, buyBlockedReason, buyCtaLabel, buyLimitPending, leverageMax = 10, leverageTiers = [1, 2, 5, 7, 10], onPreview: handlePreview,
    onCloseAndContinue, isBinarySingleMarket, heldPos, heldSize, sellOutcomeLabel, sellLimitPrice, setSellLimitPrice,
    sellMark, sellLimitPending, sellClosePrice, sellAmountRef, sellQtyInput, setSellQtyInput, sellSlider, setSellSlider,
    sellQty, sellReleasedMargin, sellRealizedPnl, sellCommission, sellCashBack, sellBlockedReason, sellCtaLabel,
    sellSubmitDisabled, onSellPreview: handleSellPreview,
  } = props;
  return (
    <div className="flex flex-col bg-background rounded-lg border border-border/50 flex-shrink-0">
      <div className="flex items-center px-4 py-2 border-b border-border/30">
        <span className="text-sm font-medium">Trade</span>
      </div>

        <div className="px-4 py-3 space-y-3">
        {/* CT-1 · Buy · Sell intent tabs + order type dropdown (mirrors the spot panel) */}
        <div className="flex items-center gap-4">
          {(["buy", "sell"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setIntent(tab)}
              className={`text-xs font-semibold capitalize pb-1 border-b-2 transition-colors ${
                intent === tab
                  ? "text-foreground border-foreground"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
          <OrderTypeDropdown value={orderType} onChange={setOrderType} className="ml-auto" />
        </div>

        {/* Yes/No Toggle — 共享生产件 BinarySideToggle（SP-1-FIX2）。 */}
        <BinarySideToggle
          yesLabel={binaryLabels.yes}
          noLabel={binaryLabels.no}
          yesPrice={yesPrice}
          noPrice={noPrice}
          isYesSelected={intent === "sell" ? sellOutcome === "yes" : isYesSelected}
          activeDot
          disabledSide={intent === "sell" ? sellDisabledSide : undefined}
          yesBarText={intent === "sell" && !heldPositions.yes ? "0 contracts" : undefined}
          noBarText={intent === "sell" && !heldPositions.no ? "0 contracts" : undefined}
          onSelect={onSelectSide}
        />

        {intent === "buy" ? (
        <>



        {/* Leverage — 交易页收尾: hidden when the category cap is < 2× (order goes at 1×) */}
        {leverageMax >= 2 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Leverage</span>
            <span className="text-sm font-bold text-trading-purple">{leverage}x</span>
          </div>

          {/* Slider */}
          <Slider
            value={[leverage]}
            onValueChange={(value) => setLeverage(value[0])}
            min={1}
            max={leverageMax}
            step={1}
            className="w-full"
          />

          {/* Quick Select Buttons */}
          <div className="flex gap-1.5">
            {leverageTiers.map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={`flex-1 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  leverage === lev 
                    ? "bg-muted text-foreground font-medium" 
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Available Balance */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Available (USDC)</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">{available.toLocaleString()}</span>
            <TransferEntry direction="to_futures" />
          </div>
        </div>


        {/* Price Input (for Limit orders) */}
        {orderType === "Limit" && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Price</span>
            <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
              <input
                type="text"
                value={limitPrice || sidePrice.toFixed(4)}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="flex-1 bg-transparent outline-none font-mono text-sm"
                placeholder="0.0000"
              />
              <span className="text-muted-foreground text-xs">USDC</span>
            </div>
            {buyLimitPending && (
              <p className="text-[10px] text-muted-foreground">
                Limit below mark — order will rest as Pending until touched.
              </p>
            )}
          </div>
        )}

        {/* Amount/Qty Input */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Amount</span>
          <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
            <input
              type="text"
              value={amountMode === "units" ? unitsInput : amount}
              onChange={(e) => (amountMode === "units" ? setUnitsInput(e.target.value) : setAmount(e.target.value))}
              className="flex-1 bg-transparent outline-none font-mono text-sm"
              placeholder={amountMode === "units" ? "0" : "0.00"}
              inputMode="decimal"
            />
            <AmountUnitDropdown value={amountMode} unitLabel="Contracts" onChange={setAmountMode} />
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-1">
          <Slider
            value={sliderValue}
            onValueChange={(val) => {
              setSliderValue(val);
              if (amountMode === "units") setUnitsInput(String(Math.round((maxUnits * val[0]) / 100)));
              else setAmount((available * val[0] / 100).toFixed(2));
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

        {/* Options */}
        <div className="space-y-2">
          {/* TP/SL Section - Simple Dropdown Style */}
          <div className="space-y-2">
            <button 
              onClick={() => setTpsl(!tpsl)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${tpsl ? 'bg-foreground border-foreground' : 'border-muted-foreground'}`}>
                  {tpsl && <span className="text-[10px] text-background">✓</span>}
                </div>
                <span className="text-xs text-muted-foreground">TP/SL</span>
              </div>
              {tpsl ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {tpsl && (
              <div className="space-y-2 animate-fade-in">
                {/* Take Profit */}
                <div className="space-y-1">
                  <span className="text-xs text-trading-green">Take Profit</span>
                  <div className="flex items-center bg-muted rounded-lg px-2.5 py-2 gap-1">
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
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          tpMode === "pct" ? "bg-trading-green/20 text-trading-green" : "text-muted-foreground"
                        }`}
                      >
                        %
                      </button>
                      <button
                        onClick={() => setTpMode("price")}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
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
                <div className="space-y-1">
                  <span className="text-xs text-trading-red">Stop Loss</span>
                  <div className="flex items-center bg-muted rounded-lg px-2.5 py-2 gap-1">
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
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          slMode === "pct" ? "bg-trading-red/20 text-trading-red" : "text-muted-foreground"
                        }`}
                      >
                        %
                      </button>
                      <button
                        onClick={() => setSlMode("price")}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
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
        </div>

        {/* Order Summary */}
        <div className="space-y-1 text-xs pt-2 border-t border-border/30">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contracts</span>
            <span className={parseFloat(amount) > 0 ? "text-foreground font-mono" : "text-muted-foreground"}>
              {parseFloat(amount) > 0 ? parseInt(orderCalculations.quantity).toLocaleString() : "--"}
            </span>
          </div>
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
          <div className="flex justify-between">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              To win
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px] p-2">
                    <WinTooltipBody />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className={parseFloat(amount) > 0 ? "text-foreground font-mono" : "text-muted-foreground"}>
              {parseFloat(amount) > 0 ? `${parseInt(orderCalculations.potentialWin).toLocaleString()} USDC` : "--"}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        {orderIntent.kind === "blocked-cross-zero" && (
          <div className="space-y-2 rounded-lg border border-trading-red/30 bg-trading-red/10 px-3 py-2 text-[11px] text-trading-red">
            <p>You hold {orderIntent.existingQty.toLocaleString()} {orderIntent.existingPosition?.type} shares. Close it before opening the opposite side.</p>
            <button
              type="button"
              onClick={onCloseAndContinue}
              className="text-foreground underline underline-offset-2"
            >
              Close & Continue
            </button>
          </div>
        )}
        <TradeSubmitButton
          side={side}
          label={buyBlockedReason || buyCtaLabel}
          potentialWin={parseFloat(amount) > 0 ? parseInt(orderCalculations.potentialWin).toLocaleString() : "0"}
          onClick={handlePreview}
          disabled={!!buyBlockedReason || orderIntent.kind === "blocked-cross-zero"}
          hideWin={buyBlockedReason.startsWith("Close-only")}
          positionSide={isBinarySingleMarket ? (isYesSelected ? "yes" : "no") : undefined}
        />
        </>
        ) : (
        <>
        {/* CT-1 · Sell = reduce-only close of the netted position */}
        {sellDisabledSide === "both" && (
          <div className="text-xs text-muted-foreground">No position to close yet</div>
        )}

        {heldPos && (
          <div className="text-[11px] text-muted-foreground">
            Held <span className="font-mono text-foreground">{heldSize.toLocaleString()}</span> contracts ·{" "}
            {sellOutcomeLabel} · <span className="font-mono">{Math.round(heldPos.leverageNum) || 1}x</span> · entry{" "}
            <span className="font-mono">{heldPos.entryPriceNum.toFixed(4)}</span>
          </div>
        )}

        {/* Available Balance */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Available (USDC)</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">{available.toLocaleString()}</span>
            <TransferEntry direction="to_futures" />
          </div>
        </div>

        {orderType === "Limit" && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Close price</span>
            <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
              <input
                type="text"
                value={sellLimitPrice || sellMark.toFixed(4)}
                onChange={(e) => setSellLimitPrice(e.target.value)}
                className="flex-1 bg-transparent outline-none font-mono text-sm"
                placeholder="0.0000"
              />
              <span className="text-muted-foreground text-xs">USDC</span>
            </div>
            {sellLimitPending && (
              <p className="text-[10px] text-muted-foreground">
                Limit {sellClosePrice > sellMark ? "above" : "below"} mark — order will rest as Pending until touched.
              </p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Amount</span>
          <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
            <input
              ref={sellAmountRef}
              type="text"
              value={sellQtyInput}
              onChange={(e) => setSellQtyInput(e.target.value.replace(/[^0-9]/g, ""))}
              className="flex-1 bg-transparent outline-none font-mono text-sm"
              placeholder="0"
            />
            <span className="text-muted-foreground text-xs font-medium">Contracts</span>
          </div>
        </div>

        <div className="space-y-1">
          <Slider
            value={sellSlider}
            onValueChange={(val) => {
              setSellSlider(val);
              setSellQtyInput(String(Math.round((heldSize * val[0]) / 100)));
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

        {/* Sell summary */}
        <div className="space-y-1 text-xs pt-2 border-t border-border/30">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Close price (mark)</span>
            <span className="text-foreground font-mono">{sellClosePrice.toFixed(4)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contracts</span>
            <span className="text-foreground font-mono">{sellQty.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Released margin</span>
            <span className="text-foreground font-mono">{sellReleasedMargin.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Realized PnL est.</span>
            <span className={`font-mono ${sellRealizedPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
              {sellRealizedPnl >= 0 ? "+" : "-"}{Math.abs(sellRealizedPnl).toFixed(2)} USDC
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. commission</span>
            <span className="text-foreground font-mono">{sellCommission.toFixed(2)} USDC</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border/30 font-medium">
            <span className="text-foreground">You receive</span>
            <span className="text-foreground font-mono">{sellCashBack.toFixed(2)} USDC</span>
          </div>
        </div>

        <TradeSubmitButton
          side="sell"
          label={sellBlockedReason || sellCtaLabel}
          winPrefix="You receive"
          potentialWin={sellCashBack.toFixed(2)}
          onClick={handleSellPreview}
          disabled={!!sellBlockedReason || sellSubmitDisabled}
        />
        </>
        )}
        </div>
      </div>
  );
};
