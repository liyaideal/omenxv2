// ============================================================
// Pro /spot trade panel (SP-1 · B2) — the 280px right-rail panel.
//
// Extracted from SpotTrading so the style guide can mount the REAL panel
// with fixture props (CHK-9: no hand-copied shells in the dictionary).
// Presentational only: every number is computed by the page and passed in.
// ============================================================
import { HelpCircle, Info } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { BinarySideToggle } from "@/components/pro/BinarySideToggle";
import { OrderTypeDropdown, type ProOrderType } from "@/components/pro/OrderTypeDropdown";
import { TradeSubmitButton } from "@/components/trading/TradeSubmitButton";
import { WinTooltipBody } from "@/components/lite/shared/WinTooltipBody";

export type ProSpotSide = "buy" | "sell";

export interface ProSpotPanelProps {
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
}

const Row = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span>{children}</span>
  </div>
);

export const ProSpotPanel = (p: ProSpotPanelProps) => {
  const isSell = p.side === "sell";
  const disabledSide: "yes" | "no" | "both" | undefined = !isSell
    ? undefined
    : p.heldYesQty <= 0 && p.heldNoQty <= 0
    ? "both"
    : p.heldYesQty <= 0
    ? "yes"
    : p.heldNoQty <= 0
    ? "no"
    : undefined;

  return (
    <div className="flex flex-col bg-background rounded-lg border border-border/50">
      <div className="flex items-center px-4 py-2 border-b border-border/30">
        <span className="text-sm font-medium">Trade</span>
        <Badge variant="outline" className="ml-2 text-[10px]">SPOT</Badge>
      </div>
      <div className="px-4 py-3 space-y-3">
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
        />
        {isSell && disabledSide === "both" && (
          <div className="text-[11px] text-muted-foreground">No shares to sell yet</div>
        )}

        {/* Balance / holdings */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Available (USDC)</span>
          <span className="font-mono">{p.available.toFixed(2)}</span>
        </div>
        {isSell && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Held</span>
            <span className="font-mono">· {p.heldQty.toFixed(0)} sh {p.outcomeLabel}</span>
          </div>
        )}

        {/* Limit price */}
        {p.orderType === "Limit" && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Limit price</span>
            <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
              <input
                type="text"
                value={p.limitPrice}
                onChange={(e) => p.onLimitPriceChange(e.target.value)}
                className="flex-1 bg-transparent outline-none font-mono text-sm"
                placeholder="0.0000"
                inputMode="decimal"
              />
              <span className="text-muted-foreground text-xs">USD</span>
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Amount</span>
          <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
            <input
              type="text"
              value={p.amount}
              onChange={(e) => p.onAmountChange(e.target.value)}
              className="flex-1 bg-transparent outline-none font-mono text-sm"
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
              p.onAmountChange(isSell ? raw.toFixed(0) : raw.toFixed(2));
            }}
            max={100}
            step={1}
          />
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
            {["0%", "25%", "50%", "75%", "100%"].map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>

        {/* Slippage — market only. Neutral chips: no market-axis hue here. */}
        {p.orderType === "Market" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
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
              <span className="text-xs font-mono">{(p.slippageBps / 100).toFixed(2)}%</span>
            </div>
            <div className="flex gap-1.5">
              {[10, 25, 50, 100].map((bps) => (
                <button
                  key={bps}
                  onClick={() => p.onSlippageChange(bps)}
                  className={cn(
                    "flex-1 py-1 text-[11px] rounded transition-colors",
                    p.slippageBps === bps
                      ? "bg-foreground text-background font-semibold"
                      : "border border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {(bps / 100).toFixed(2)}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-md bg-muted/30 p-2.5 text-xs font-mono space-y-1">
          {isSell ? (
            <>
              <Row label="Proceeds">${p.cost.toFixed(2)}</Row>
              <Row label="Shares">{p.qty.toFixed(0)}</Row>
              <Row label="Est. commission">${p.sellCommission.toFixed(2)}</Row>
              <Row label="You receive">${p.sellReceive.toFixed(2)}</Row>
            </>
          ) : (
            <>
              <Row label="Cost">${p.cost.toFixed(2)}</Row>
              {p.orderType === "Market" && (
                <div className="flex justify-end text-[10px] text-muted-foreground -mt-1">
                  Est. fill @ {p.bestAsk.toFixed(2)}
                </div>
              )}
              <Row label="Shares">{p.qty.toFixed(0)}</Row>
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
                ${p.maxWin.toFixed(2)}
              </Row>
              <Row label="Fee (0.15%)">${p.fee.toFixed(2)}</Row>
            </>
          )}
        </div>

        {/* Spot account balance hint — spot funds only. */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3" />
          Standard Account · ${p.spotBalance.toFixed(2)} available
        </div>
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
              ? `Limit below best ask $${p.bestAsk.toFixed(2)} — order will rest as Pending until touched. $${p.cost.toFixed(2)} reserved.`
              : `Limit above best bid $${p.bestBid.toFixed(2)} — order will rest as Pending until touched.`}
          </div>
        )}

        <TradeSubmitButton
          side={p.side}
          label={p.ctaLabel}
          potentialWin={(isSell ? p.sellReceive : p.maxWin).toFixed(2)}
          winPrefix={isSell ? "You receive" : "To win"}
          onClick={p.onSubmit}
          disabled={p.ctaDisabled}
          loading={p.submitting}
          positionSide={isSell ? undefined : p.isYesSelected ? "yes" : "no"}
        />
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
        <span className="font-mono text-foreground">${available.toFixed(2)}</span>
      </Row>
      <Row label="In orders">
        <span className="font-mono">${inOrders.toFixed(2)}</span>
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
            <Row label="Shares">{p.qty.toFixed(0)}</Row>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5 text-xs font-mono">
            {isSell ? (
              <>
                <Row label="Proceeds">${p.cost.toFixed(2)}</Row>
                <Row label="Est. commission">${p.sellCommission.toFixed(2)}</Row>
                <Row label="You receive">${p.sellReceive.toFixed(2)}</Row>
              </>
            ) : (
              <>
                <Row label="Cost">${p.cost.toFixed(2)}</Row>
                <Row label="Fee (0.15%)">${p.fee.toFixed(2)}</Row>
                <Row label="To win">${p.maxWin.toFixed(2)}</Row>
              </>
            )}
          </div>

          <TradeSubmitButton
            size="lg"
            side={p.side}
            label={p.ctaLabel}
            potentialWin={(isSell ? p.sellReceive : p.maxWin).toFixed(2)}
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
