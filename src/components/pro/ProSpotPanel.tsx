// ============================================================
// Pro /spot trade panel (SP-1 · B2) — the 280px right-rail panel.
//
// Extracted from SpotTrading so the style guide can mount the REAL panel
// with fixture props (CHK-9: no hand-copied shells in the dictionary).
// Presentational only: every number is computed by the page and passed in.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { ChevronDown, HelpCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BinarySideToggle } from "@/components/pro/BinarySideToggle";
import { OrderTypeDropdown, type ProOrderType } from "@/components/pro/OrderTypeDropdown";
import { TradeSubmitButton } from "@/components/trading/TradeSubmitButton";
import { WinTooltipBody } from "@/components/lite/shared/WinTooltipBody";

export type ProSpotSide = "buy" | "sell";

export interface ProSpotPanelProps {
  /** Desktop terminal uses a card; mobile `/spot/order` grows directly from the page. */
  chrome?: "card" | "bare";
  side: ProSpotSide;
  onSideChange: (s: ProSpotSide) => void;
  orderType: ProOrderType;
  onOrderTypeChange: (t: ProOrderType) => void;

  yesLabel: string;
  noLabel: string;
  yesPrice: number;
  noPrice: number;
  isYesSelected: boolean;
  onSelectOutcome: (which: "yes" | "no") => void;
  heldYesQty: number;
  heldNoQty: number;

  outcomeLabel: string;
  available: number;
  heldQty: number;
  spotBalance: number;

  limitPrice: string;
  onLimitPriceChange: (v: string) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  sliderValue: number[];
  onSliderChange: (v: number[]) => void;
  /** 100% of the slider — spot balance on Buy, held shares on Sell. */
  sliderBase: number;
  slippageBps: number;
  onSlippageChange: (bps: number) => void;

  qty: number;
  cost: number;
  fee: number;
  maxWin: number;
  sellCommission: number;
  sellReceive: number;
  bestAsk: number;
  bestBid: number;
  openOrdersReserved?: number;

  settleEtOnly?: string | null;
  tickInvalid: boolean;
  willBePending: boolean;

  ctaLabel: string;
  ctaDisabled: boolean;
  submitting: boolean;
  onSubmit: () => void;
  /** SP-2-FIX2: mobile `/spot/order` stacks the CTA so nothing truncates. */
  ctaLayout?: "row" | "stacked";
}

/**
 * Share quantities are FRACTIONAL on spot. Display up to 3 dp with trailing
 * zeros trimmed (`2,034.879`); never round a held size to an integer, because
 * the displayed value is also what pre-fills the sell amount.
 */
export const formatShares = (n: number) =>
  (Math.round(n * 1000) / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 });

/** Same value, but as a raw input string (no thousands separators). */
export const sharesInputValue = (n: number) => String(Math.round(n * 1000) / 1000);

/** SP-2-FIX2: money with thousands separators, always 2 dp (`1,073.14`). */
export const money2 = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Row = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span>{children}</span>
  </div>
);


export const ProSpotPanel = (p: ProSpotPanelProps) => {
  const isSell = p.side === "sell";
  const isBare = p.chrome === "bare";
  const ctaWrapRef = useRef<HTMLDivElement>(null);
  const ctaMeasureRef = useRef<HTMLSpanElement>(null);
  const [autoCtaLayout, setAutoCtaLayout] = useState<"row" | "stacked">("row");
  const disabledSide: "yes" | "no" | "both" | undefined = !isSell
    ? undefined
    : p.heldYesQty <= 0 && p.heldNoQty <= 0
    ? "both"
    : p.heldYesQty <= 0
    ? "yes"
    : p.heldNoQty <= 0
    ? "no"
    : undefined;

  useEffect(() => {
    if (!isBare) return;
    const wrap = ctaWrapRef.current;
    const measure = ctaMeasureRef.current;
    if (!wrap || !measure) return;
    const update = () => {
      // TradeSubmitButton row reserves a 24px gap/arrow area around this text.
      setAutoCtaLayout(measure.scrollWidth + 24 <= wrap.clientWidth ? "row" : "stacked");
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [isBare, p.ctaLabel, p.side, p.maxWin, p.sellReceive]);

  const ctaLayout = isBare ? autoCtaLayout : p.ctaLayout;

  return (
    <div className={cn("flex flex-col", !isBare && "bg-background rounded-lg border border-border/50")}>
      {!isBare && (
        <div className="flex items-center px-4 py-2 border-b border-border/30">
          <span className="text-sm font-medium">Trade</span>
          <Badge variant="outline" className="ml-2 text-[10px]">SPOT</Badge>
        </div>
      )}
      <div className={isBare ? "px-3 pb-2 space-y-2" : "px-4 py-3 space-y-3"}>
        {/* Intent + order type — one row, the panel's only chrome line. */}
        <div className="flex items-center border-b border-border/40 pb-1.5">
          <div className="flex items-center" style={{ gap: 14 }}>
            {(["buy", "sell"] as const).map((s) => (
              <button
                key={s}
                onClick={() => p.onSideChange(s)}
                className={cn(
                  "text-xs font-semibold capitalize pb-1 border-b-2 transition-colors",
                  p.side === s
                    ? "text-foreground border-foreground"
                    : "text-muted-foreground border-transparent hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <OrderTypeDropdown value={p.orderType} onChange={p.onOrderTypeChange} className="ml-auto" />
        </div>

        <BinarySideToggle
          yesLabel={p.yesLabel}
          noLabel={p.noLabel}
          yesPrice={p.yesPrice}
          noPrice={p.noPrice}
          isYesSelected={p.isYesSelected}
          disabledSide={disabledSide}
          yesBarText={isSell && p.heldYesQty <= 0 ? "0 sh" : undefined}
          noBarText={isSell && p.heldNoQty <= 0 ? "0 sh" : undefined}
          onSelect={p.onSelectOutcome}
          activeDot={isBare}
        />
        {isSell && disabledSide === "both" && (
          <div className="text-[11px] text-muted-foreground">No shares to sell yet</div>
        )}

        {/* Balance / holdings */}
        <div className={cn("flex items-center justify-between", isBare ? "text-xs" : "text-[11px]")}>
          <span className="text-muted-foreground">Available (USDC)</span>
          <span className="font-mono">{money2(p.available)}</span>
        </div>
        {isSell && (
          <div className={cn("flex items-center justify-between", isBare ? "text-xs" : "text-[11px]")}>
            <span className="text-muted-foreground">Held</span>
            <span className="font-mono">{formatShares(p.heldQty)} sh · {p.outcomeLabel}</span>
          </div>
        )}

        {/* Limit price */}
        {p.orderType === "Limit" && (
          <div className={isBare ? "space-y-0.5" : "space-y-1"}>
            <span className={cn("text-muted-foreground", isBare ? "text-[10px]" : "text-xs")}>Limit price</span>
            <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
              <input
                type="text"
                value={p.limitPrice}
                onChange={(e) => p.onLimitPriceChange(e.target.value)}
                className={cn("flex-1 bg-transparent outline-none font-mono", isBare ? "text-xs" : "text-sm")}
                placeholder="0.0000"
                inputMode="decimal"
              />
              <span className="text-muted-foreground text-xs">USD</span>
            </div>
          </div>
        )}

        {/* Amount */}
        <div className={isBare ? "space-y-0.5" : "space-y-1"}>
          <span className={cn("text-muted-foreground", isBare ? "text-[10px]" : "text-xs")}>Amount</span>
          <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
            <input
              type="text"
              value={p.amount}
              onChange={(e) => p.onAmountChange(e.target.value)}
              className={cn("flex-1 bg-transparent outline-none font-mono", isBare ? "text-xs" : "text-sm")}
              placeholder="0.00"
              inputMode="decimal"
            />
            <span className="text-muted-foreground text-xs font-medium">{isSell ? "sh" : "USDC"}</span>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-1">
          <Slider
            value={p.sliderValue}
            onValueChange={(val) => {
              p.onSliderChange(val);
              const raw = (p.sliderBase * val[0]) / 100;
              p.onAmountChange(isSell ? sharesInputValue(raw) : raw.toFixed(2));
            }}
            max={100}
            step={1}
          />
          <div className={cn("flex justify-between font-mono text-muted-foreground", isBare ? "text-[10px]" : "text-[9px]")}>
            {["0%", "25%", "50%", "75%", "100%"].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>

        {/* Slippage — market only. Neutral chips: no market-axis hue here. */}
        {p.orderType === "Market" && (
          <div className={isBare ? "" : "space-y-1"}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                Max slippage
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] p-2">
                      <p className="text-xs">Market = marketable limit at mark ± slippage cap</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              {isBare ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Max slippage"
                      className="h-7 px-2 rounded-md border border-border/60 text-[11px] font-semibold inline-flex items-center gap-1 text-foreground hover:bg-muted/40 transition-colors"
                    >
                      {(p.slippageBps / 100).toFixed(2)}%
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[7rem]">
                    {[10, 25, 50, 100].map((bps) => (
                      <DropdownMenuItem key={bps} onSelect={() => p.onSlippageChange(bps)} className="text-xs">
                        {(bps / 100).toFixed(2)}%
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="text-xs font-mono">{(p.slippageBps / 100).toFixed(2)}%</span>
              )}
            </div>
            {!isBare && <div className="grid grid-cols-4 gap-1">
              {[10, 25, 50, 100].map((bps) => (
                <button
                  key={bps}
                  onClick={() => p.onSlippageChange(bps)}
                  className={cn(
                    "py-1 text-[10px] rounded transition-colors whitespace-nowrap",
                    p.slippageBps === bps
                      ? "bg-foreground text-background font-semibold"
                      : "border border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {(bps / 100).toFixed(2)}%
                </button>
              ))}
            </div>}
          </div>
        )}

        {/* Summary */}
        <div className={cn("font-mono space-y-1", isBare ? "text-xs" : "rounded-md bg-muted/30 p-2.5 text-[11px]")}>
          {isSell ? (
            <>
              <Row label="Proceeds">${money2(p.cost)}</Row>
              {!isBare && <Row label="Shares">{formatShares(p.qty)}</Row>}
              <Row label="Est. commission">${money2(p.sellCommission)}</Row>
              <div className={cn("flex justify-between", isBare && "pt-2 border-t border-border/30 font-medium text-foreground")}>
                <span>You receive</span>
                <span>${money2(p.sellReceive)}</span>
              </div>
            </>
          ) : (
            <>
              <Row label="Cost">${money2(p.cost)}</Row>
              {!isBare && p.orderType === "Market" && (
                <div className="flex justify-end text-[10px] text-muted-foreground -mt-1">
                  Est. fill @ {p.bestAsk.toFixed(2)}
                </div>
              )}
              {isBare && <Row label="Fee (0.15%)">${money2(p.fee)}</Row>}
              {isBare && (
                <div className="flex justify-between pt-2 border-t border-border/30 font-medium text-foreground">
                  <span>Total</span>
                  <span>${money2(p.cost + p.fee)}</span>
                </div>
              )}
              {!isBare && <Row label="Shares">{formatShares(p.qty)}</Row>}
              <Row
                label={
                  <span className="inline-flex items-center gap-1">
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
                }
              >
                ${money2(p.maxWin)}
              </Row>
              {!isBare && <Row label="Fee (0.15%)">${money2(p.fee)}</Row>}
            </>
          )}
        </div>

        {isBare && (
          <div className="text-[11px] text-muted-foreground">
            To win shows profit after the 5% winning commission.
          </div>
        )}

        {/* Spot account balance hint — spot funds only. */}
        {!isBare && <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3" />
          Standard Account · ${money2(p.spotBalance)} available
        </div>}
        {p.settleEtOnly && (
          <div className="text-[10px] text-muted-foreground">
            Settles &amp; credits by ~{p.settleEtOnly}
          </div>
        )}
        {p.tickInvalid && p.orderType === "Limit" && (
          <div className="text-[10px] text-trading-red">
            Price must be a multiple of $0.01 (tick).
          </div>
        )}
        {p.willBePending && !p.tickInvalid && (
          <div className="text-[10px] text-trading-yellow">
            {p.side === "buy"
              ? `Limit below best ask $${p.bestAsk.toFixed(2)} — order will rest as Pending until touched. $${money2(p.cost + p.fee)} reserved.`
              : `Limit above best bid $${p.bestBid.toFixed(2)} — order will rest as Pending until touched.`}
          </div>
        )}

        <div ref={ctaWrapRef} data-spot-cta-layout={ctaLayout ?? "row"} className="relative min-w-0">
          {isBare && (
            <span ref={ctaMeasureRef} aria-hidden className="absolute invisible whitespace-nowrap text-[13px] font-semibold font-sans">
              {p.ctaLabel} {isSell ? "You receive" : "To win"} ${money2(isSell ? p.sellReceive : p.maxWin)}
            </span>
          )}
          <TradeSubmitButton
            side={p.side}
            label={p.ctaLabel}
            potentialWin={money2(isSell ? p.sellReceive : p.maxWin)}
            winPrefix={isSell ? "You receive" : "To win"}
            layout={ctaLayout}
            size={isBare ? "sm" : undefined}
            onClick={p.onSubmit}
            disabled={p.ctaDisabled}
            loading={p.submitting}
            positionSide={isSell ? undefined : p.isYesSelected ? "yes" : "no"}
          />
        </div>
      </div>
    </div>
  );
};

export interface ProSpotAccountPanelProps {
  available: number;
  inOrders: number;
  openPositions: number;
}

/** Right-rail account card — Standard (spot) funds only. */
export const ProSpotAccountPanel = ({ available, inOrders, openPositions }: ProSpotAccountPanelProps) => (
  <div className="flex flex-col bg-background rounded-lg border border-border/50">
    <div className="flex items-center px-4 py-2 border-b border-border/30">
      <span className="text-sm font-medium">Standard Account</span>
    </div>
    <div className="px-4 py-3 space-y-2 text-xs">
      <Row label="Available (USDC)">
        <span className="font-mono text-foreground">${money2(available)}</span>
      </Row>
      <Row label="In orders">
        <span className="font-mono">${money2(inOrders)}</span>
      </Row>
      <Row label="Open positions">
        <span className="font-mono">{openPositions}</span>
      </Row>
      <div className="text-[10px] text-muted-foreground pt-1">
        Standard and Boost accounts are funded separately. Transfer funds to your Standard Account to trade.
      </div>
    </div>
  </div>
);

export interface ProSpotOrderPreviewProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventName: string;
  outcomeLabel: string;
  side: ProSpotSide;
  orderType: ProOrderType;
  price: number;
  qty: number;
  cost: number;
  fee: number;
  maxWin: number;
  sellCommission: number;
  sellReceive: number;
  ctaLabel: string;
  submitting: boolean;
  isYesSelected: boolean;
  onConfirm: () => void;
}

/** Order preview dialog — same frame as the futures terminal. */
export const ProSpotOrderPreview = (p: ProSpotOrderPreviewProps) => {
  const isSell = p.side === "sell";
  return (
    <Dialog open={p.open} onOpenChange={p.onOpenChange}>
      <DialogContent className="sm:max-w-md gap-4 p-5">
        <DialogHeader>
          <DialogTitle>Order Preview</DialogTitle>
          <DialogDescription className="sr-only">
            Review your spot order before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium truncate">{p.eventName}</span>
            <Badge variant="outline" className="text-[10px]">{p.outcomeLabel}</Badge>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5 text-xs font-mono">
            <Row label="Outcome">{p.outcomeLabel}</Row>
            <Row label="Side">{isSell ? "Sell" : "Buy"}</Row>
            <Row label="Type">{p.orderType}</Row>
            <Row label={p.orderType === "Limit" ? "Price" : "Est. fill"}>${p.price.toFixed(4)}</Row>
            <Row label="Shares">{formatShares(p.qty)}</Row>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5 text-xs font-mono">
            {isSell ? (
              <>
                <Row label="Proceeds">${money2(p.cost)}</Row>
                <Row label="Est. commission">${money2(p.sellCommission)}</Row>
                <Row label="You receive">${money2(p.sellReceive)}</Row>
              </>
            ) : (
              <>
                <Row label="Cost">${money2(p.cost)}</Row>
                <Row label="Fee (0.15%)">${money2(p.fee)}</Row>
                <Row label="To win">${money2(p.maxWin)}</Row>
              </>
            )}
          </div>

          <TradeSubmitButton
            size="lg"
            side={p.side}
            label={p.ctaLabel}
            potentialWin={money2(isSell ? p.sellReceive : p.maxWin)}
            loading={p.submitting}
            winPrefix={isSell ? "You receive" : "To win"}
            onClick={p.onConfirm}
            positionSide={isSell ? undefined : p.isYesSelected ? "yes" : "no"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
