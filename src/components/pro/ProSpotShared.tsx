// ============================================================
// SP-2 · shared render blocks for the Pro SPOT terminal.
// Desktop `/spot`, mobile `/spot` and mobile `/spot/order` all render
// these — there is exactly one implementation of the trade panel,
// order preview, account panel, event info and the positions/orders
// tables. Desktop markup is unchanged from SpotTrading.tsx.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EventInfoContent } from "@/components/EventInfoContent";
import {
  ProSpotPanel,
  ProSpotAccountPanel,
  ProSpotOrderPreview,
  money2,
  formatShares,
} from "@/components/pro/ProSpotPanel";
import { ProBottomTabs } from "@/components/pro/ProBottomTabs";
import { mock24hVolume, type SpotTerminal } from "@/hooks/useSpotTerminal";
import type { TradingEvent } from "@/hooks/useEvents";
import { TRADING_TERMS } from "@/lib/tradingTerms";

/** SP-2-FIX4 · one money format on every Pro spot surface (`+$1,073.14`). */
const spotPnlText = (n: number) => `${n >= 0 ? "+" : "-"}$${money2(Math.abs(n))}`;

/** Order rows arrive pre-formatted (`$1,234.00`); read the number back out. */
const num = (v: string) => Number(String(v).replace(/[^0-9.-]/g, "")) || 0;

export const SpotTradePanel = ({
  t,
  ctaLayout,
  chrome,
}: {
  t: SpotTerminal;
  /** SP-2-FIX2: mobile `/spot/order` stacks the CTA. Desktop stays `row`. */
  ctaLayout?: "row" | "stacked";
  chrome?: "card" | "bare";
}) => (
  <ProSpotPanel
    chrome={chrome}
    ctaLayout={ctaLayout}
    side={t.side}
    onSideChange={t.onSideChange}
    orderType={t.orderType}
    onOrderTypeChange={t.setOrderType}
    yesLabel={t.yesLabel}
    noLabel={t.noLabel}
    yesPrice={t.yesLive}
    noPrice={t.noLive}
    isYesSelected={t.isYesSelected}
    onSelectOutcome={t.onSelectOutcome}
    heldYesQty={t.heldYesQty}
    heldNoQty={t.heldNoQty}
    outcomeLabel={t.outcomeLabel}
    available={t.available}
    heldQty={t.heldQty}
    limitPrice={t.limitPrice}
    onLimitPriceChange={t.setLimitPrice}
    amount={t.amount}
    onAmountChange={t.setAmount}
    sliderValue={t.sliderValue}
    onSliderChange={t.setSliderValue}
    sliderBase={t.sliderBase}
    slippageBps={t.slippageBps}
    onSlippageChange={t.setSlippageBps}
    qty={t.qty}
    cost={t.cost}
    fee={t.fee}
    maxWin={t.maxWin}
    sellCommission={t.sellCommission}
    sellReceive={t.sellReceive}
    bestAsk={t.bestAsk}
    bestBid={t.bestBid}
    settleEtOnly={t.settleEtOnly}
    tickInvalid={t.tickInvalid}
    willBePending={t.willBePending}
    ctaLabel={t.blocked ? t.blockedReason || "Market unavailable" : t.ctaLabel}
    ctaDisabled={t.ctaDisabled}
    submitting={t.submitting}
    onSubmit={t.openPreview}
  />
);

export const SpotOrderPreviewDialog = ({ t }: { t: SpotTerminal }) =>
  t.event ? (
    <ProSpotOrderPreview
      open={t.previewOpen}
      onOpenChange={t.setPreviewOpen}
      eventName={t.event.name}
      outcomeLabel={t.outcomeLabel}
      side={t.side}
      orderType={t.orderType}
      price={t.effectivePrice}
      qty={t.qty}
      cost={t.cost}
      fee={t.fee}
      maxWin={t.maxWin}
      sellCommission={t.sellCommission}
      sellReceive={t.sellReceive}
      ctaLabel={t.ctaLabel}
      submitting={t.submitting}
      isYesSelected={t.isYesSelected}
      onConfirm={() => {
        t.setPreviewOpen(false);
        t.handleSubmit();
      }}
    />
  ) : null;

export const SpotAccountPanel = ({ t }: { t: SpotTerminal }) => (
  <ProSpotAccountPanel
    available={t.spotBalance}
    inOrders={t.reservedInOrders}
    openPositions={t.spotPositions.length}
  />
);

const InfoCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded border border-border/40 bg-muted/20 p-2">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-0.5 text-foreground">{value}</div>
  </div>
);

export const SpotEventInfoPanel = ({ t }: { t: SpotTerminal }) => {
  const event = t.event;
  if (!event) return null;
  return (
    <div className="p-6 overflow-auto text-sm space-y-4">
      <EventInfoContent event={spotHeaderEvent(t)} />
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <InfoCell
          label="Prior official close"
          value={t.basePrice != null ? `${t.cur}${money2(t.basePrice)}` : "—"}
        />
        <InfoCell label="Settles vs" value={`Prior close · flat close = ${t.noLabel}`} />
        <InfoCell label="Resolution source" value={event.source_name || "databento"} />
        <InfoCell
          label="Symbol"
          value={`${t.ticker} · ${t.market.key === "hk" ? "HKEX" : t.market.key === "kr" ? "KRX" : "Nasdaq"}`}
        />
        <InfoCell label="Volume" value={mock24hVolume(event.id)} />
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="font-semibold text-foreground text-sm">Rules</div>
        {event.rules ? (
          <ul className="list-disc pl-4 space-y-1">
            {event.rules
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            <li>
              All open orders are automatically cancelled and refunded at freeze{" "}
              ({t.freezeLabel}).
            </li>
          </ul>
        ) : (
          <p className="italic">Rules not yet published for this market.</p>
        )}
      </div>

      {t.settleEtOnly && (
        <div className="text-xs text-muted-foreground">
          Settles &amp; credits by ~{t.settleEtOnly}.
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------
// Positions / Orders tables — no leverage / no liq. / no funding.
// `variant="mobile"` swaps the desktop grid for a 375 px row stack;
// the desktop grid markup is untouched.
// -----------------------------------------------------------------
export const SpotPositionsTable = ({
  t,
  variant = "desktop",
}: {
  t: SpotTerminal;
  variant?: "desktop" | "mobile";
}) => {
  const rows = t.spotPositions;

  if (variant === "mobile") {
    return (
      <div className="px-4 py-3 space-y-3">
        {rows.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">No open positions</div>
        ) : (
          rows.map((p) => {
            const isYes = p.optionId ? p.optionId === t.yesOpt?.id : t.isYesLabel(p.option);
            return (
              <div key={p.id} className="bg-card rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-semibold",
                      isYes
                        ? "bg-yes/15 text-yes"
                        : "bg-no/15 text-no",
                    )}
                  >
                    {isYes ? t.yesLabel : t.noLabel}
                  </span>
                  </div>
                  <span className={cn("text-xs font-semibold", p.pnlNum >= 0 ? "text-trading-green" : "text-trading-red")}>{spotPnlText(p.pnlNum)}</span>
                </div>
                <div className="mb-2">
                  <h3 className="font-medium text-foreground text-sm line-clamp-2">{p.event}</h3>
                  <p className={cn("text-xs font-medium", isYes ? "text-yes" : "text-no")}>{isYes ? t.yesLabel : t.noLabel}</p>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Qty</span>
                    <span className="font-mono text-xs">{formatShares(p.sizeNum)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Entry</span>
                    <span className="font-mono text-xs">{p.entryPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Mark</span>
                    <span className="font-mono text-xs">{p.markPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Value</span>
                    <span className="font-mono text-xs">${money2(p.sizeNum * p.markPriceNum)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <button onClick={() => t.closePosition(p)} className="flex-1 py-1.5 text-[10px] font-medium rounded-lg text-primary hover:bg-primary/10">Close</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="text-xs">
      <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_0.7fr_0.9fr_0.6fr] gap-2 px-4 py-2 text-muted-foreground border-b border-border/30 sticky top-0 bg-background">
        <span>Market</span>
        <span>Outcome</span>
        <span className="text-right">Entry</span>
        <span className="text-right">Mark</span>
        <span className="text-right">Size (sh)</span>
        <span className="text-right">PnL</span>
        <span />
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-sm text-center text-muted-foreground">No open positions</div>
      ) : (
        rows.map((p) => {
          const isYes = p.optionId ? p.optionId === t.yesOpt?.id : t.isYesLabel(p.option);
          const outcomeText = isYes ? t.yesLabel : t.noLabel;

          return (
            <div
              key={p.id}
              className="grid grid-cols-[1.6fr_0.7fr_0.7fr_0.7fr_0.7fr_0.9fr_0.6fr] gap-2 px-4 py-2 items-center border-b border-border/20 hover:bg-muted/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-[9px]">SPOT</Badge>
                <span className="truncate">{p.event}</span>
              </div>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium w-fit",
                  isYes
                    ? "bg-yes/15 text-yes"
                    : "bg-no/15 text-no",
                )}
              >
                {outcomeText}
              </span>
              <span className="text-right font-mono">{p.entryPrice}</span>
              <span className="text-right font-mono">{p.markPrice}</span>
              <span className="text-right font-mono">{formatShares(p.sizeNum)}</span>
              <span
                className={cn(
                  "text-right font-mono",
                  p.pnlNum >= 0 ? "text-trading-green" : "text-trading-red",
                )}
              >
                {spotPnlText(p.pnlNum)}
              </span>
              <button
                onClick={() => t.closePosition(p)}
                className="text-[10px] text-primary hover:underline text-right"
              >
                Close
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

export const SpotOrdersTable = ({
  t,
  variant = "desktop",
}: {
  t: SpotTerminal;
  variant?: "desktop" | "mobile";
}) => {
  const rows = t.spotOrders;

  if (variant === "mobile") {
    return (
      <div className="px-4 py-3 space-y-3">
        {rows.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">No open orders</div>
        ) : (
          rows.map((o, i) => {
            const isPending = o.status === "Pending";
            return (
              <div key={o.id ?? i} className="bg-card rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-semibold",
                      o.type === "buy" ? "bg-yes/15 text-yes" : "bg-no/15 text-no",
                    )}
                  >
                    {o.type === "buy" ? t.yesLabel : t.noLabel}
                  </span>
                  <span className="text-sm text-muted-foreground">{o.orderType}</span>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", isPending ? "bg-trading-yellow/20 text-trading-yellow" : "bg-muted text-muted-foreground")}>{o.id && t.frozenCancelledIds.has(o.id) ? "Cancelled · market frozen" : o.status}</span>
                </div>
                <div className="mb-2">
                  <h3 className="font-medium text-foreground text-sm line-clamp-2">{o.event}</h3>
                  <p className={cn("text-xs font-medium", o.type === "buy" ? "text-yes" : "text-no")}>{o.option}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Price</span>
                    <span className="font-mono text-xs">{o.price}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Amount</span>
                    <span className="font-mono text-xs">{formatShares(num(o.amount))}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Total</span>
                    <span className="font-mono text-xs">${money2(num(o.total))}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <button disabled={t.isCancelling || !isPending} onClick={() => t.handleCancelSpotOrder(o)} className="flex-1 py-1.5 text-[10px] font-medium rounded-lg text-trading-red hover:bg-trading-red/10 disabled:opacity-40">Cancel</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="text-xs">
      <div className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.6fr_0.7fr_0.8fr_0.7fr_0.5fr] gap-2 px-4 py-2 text-muted-foreground border-b border-border/30 sticky top-0 bg-background">
        <span>Market</span>
        <span>Side</span>
        <span>Type</span>
        <span className="text-right">Limit</span>
        <span className="text-right">Qty (sh)</span>
        <span className="text-right">Reserved</span>
        <span className="text-right">Status</span>
        <span />
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-sm text-center text-muted-foreground">No open orders</div>
      ) : (
        rows.map((o, i) => {
          const reserved = o.type === "buy" ? `$${money2(num(o.total))}` : "—";
          const isPending = o.status === "Pending";
          return (
            <div
              key={o.id ?? i}
              className="grid grid-cols-[1.5fr_0.6fr_0.6fr_0.6fr_0.7fr_0.8fr_0.7fr_0.5fr] gap-2 px-4 py-2 items-center border-b border-border/20 hover:bg-muted/20"
            >
              <span className="truncate">{o.event}</span>
              <span className={cn("uppercase", o.type === "buy" ? "text-trading-green" : "text-trading-red")}>
                {o.type}
              </span>
              <span>{o.orderType}</span>
              <span className="text-right font-mono">{o.price}</span>
              <span className="text-right font-mono">{formatShares(num(o.amount))}</span>
              <span className="text-right font-mono text-muted-foreground">{reserved}</span>
              <span
                className={cn(
                  "text-right",
                  isPending ? "text-trading-yellow" : "text-muted-foreground",
                )}
              >
                {o.id && t.frozenCancelledIds.has(o.id) ? "Cancelled · market frozen" : o.status}
              </span>
              <button
                disabled={t.isCancelling || !isPending}
                onClick={() => t.handleCancelSpotOrder(o)}
                className="text-[10px] text-trading-red hover:underline text-right disabled:opacity-40 disabled:no-underline"
              >
                Cancel
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

export const SpotBottomTabs = ({
  t,
  variant = "desktop",
  bodyClassName = "max-h-[360px] overflow-y-auto",
}: {
  t: SpotTerminal;
  variant?: "desktop" | "mobile";
  bodyClassName?: string;
}) => (
  <ProBottomTabs
    tabs={[
      { key: "Positions", label: "Positions", count: t.spotPositions.length },
      { key: "Orders", label: "Current Orders", count: t.spotOrders.length },
    ]}
    active={t.bottomTab}
    onChange={(k) => t.setBottomTab(k as "Positions" | "Orders")}
    authTitle="Sign in to view spot positions"
    authDescription="Log in or create an account to view your open positions and orders."
    bodyClassName={bodyClassName}
  >
    {t.bottomTab === "Positions" ? (
      <SpotPositionsTable t={t} variant={variant} />
    ) : (
      <SpotOrdersTable t={t} variant={variant} />
    )}
  </ProBottomTabs>
);

// -----------------------------------------------------------------
// SP-2 · mobile helpers
// -----------------------------------------------------------------
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Info, Star, Share2 } from "lucide-react";
import { MobileHeaderIconButton } from "@/components/MobileHeader";

/** Adapter: the raw spot event row → the shared `TradingEvent` header shape. */
export const spotHeaderEvent = (t: SpotTerminal): TradingEvent => {
  const event = t.event!;
  return {
    id: event.id,
    name: event.name,
    icon: "",
    ends: t.countdown.text,
    endTime: t.endDate ?? new Date(),
    period: "Daily",
    volume: mock24hVolume(event.id),
    description:
      event.description || "US-stock daily up/down (spot). Winning share pays $1 at settlement.",
    rules: [],
    sourceUrl: event.source_url || "",
    sourceName: event.source_name || "databento",
    resolutionSource: event.source_name || "databento",
  };
};

/** SP-2-FIX1: one header action cluster for BOTH spot pages (DB watchlist star). */
export const SpotHeaderActions = ({ t }: { t: SpotTerminal }) => (
  <div className="flex items-center gap-1 -mr-2">
    <MobileHeaderIconButton aria-label="Favorite" onClick={() => t.toggleWatch(t.event!.id)}>
      <Star
        className={cn("w-5 h-5", t.isWatched(t.event!.id) ? "text-trading-yellow fill-trading-yellow" : "")}
        strokeWidth={1.5}
      />
    </MobileHeaderIconButton>
    <MobileHeaderIconButton
      aria-label="Share"
      onClick={() => navigator.clipboard?.writeText(window.location.href)}
    >
      <Share2 className="w-5 h-5" strokeWidth={1.5} />
    </MobileHeaderIconButton>
  </div>
);

/** Schedule ⓘ shown inline in the mobile header stats row. */
export const SpotScheduleInfo = ({ t }: { t: SpotTerminal }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button type="button" className="p-0.5 text-muted-foreground" aria-label="Schedule details">
        <Info className="w-3.5 h-3.5" />
      </button>
    </PopoverTrigger>
    <PopoverContent side="bottom" align="center" className="text-[11px] max-w-[280px] p-2">
      {t.marketKey === "crypto" ? (
        <div className="space-y-1">
          <div><span className="text-muted-foreground">Trading ends:</span> {t.freezeEtOnly ?? "—"}</div>
          <div><span className="text-muted-foreground">Settles:</span> ~{t.settleEtOnly ?? "—"}</div>
        </div>
      ) : (
        <div className="space-y-1">
          <div><span className="text-muted-foreground">Opens:</span> after prior close (extended trading)</div>
          <div><span className="text-muted-foreground">Trading ends:</span> {t.freezeEtOnly ?? "—"}</div>
          <div><span className="text-muted-foreground">Official close:</span> {t.closeEtOnly ?? "—"} (settlement price)</div>
          <div><span className="text-muted-foreground">Credits by:</span> ~{t.settleEtOnly ?? "—"}</div>
        </div>
      )}
    </PopoverContent>
  </Popover>
);

/**
 * SP-2-FIX2 · session as a 9px pill instead of `· pre-mkt` prose, so nothing
 * in the strip can ever be cut mid-word. Regular session renders nothing.
 */
const sessionPill = (tag?: string | null) => {
  const s = (tag || "").toLowerCase();
  if (s.includes("pre")) return "PRE";
  if (s.includes("after") || s.includes("post")) return "AH";
  return null;
};

/**
 * SP-2-FIX2 · short mobile header title for daily up/down markets:
 * `META · Up or down?`. The full event name lives in the Event info sheet.
 */
export const spotMobileTitle = (t: SpotTerminal): string => {
  const name = t.event?.name || "";
  if (t.ticker && /up or down/i.test(name)) return `${t.ticker} · Up or down?`;
  if (t.ticker && /higher|lower/i.test(name)) return `${t.ticker} · Up or down?`;
  return name;
};

/** 32 px two-cell stats strip — SP-2 mobile spot exception to the perp grid. */
export const SpotMobileStatsStrip = ({ t }: { t: SpotTerminal }) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const [showPercent, setShowPercent] = useState(false);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const update = () => setShowPercent(strip.getBoundingClientRect().width >= 340);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(strip);
    return () => observer.disconnect();
  }, []);

  return (
  <div
    ref={stripRef}
    data-spot-stats-strip
    className="mx-3 my-2 h-8 flex items-center overflow-hidden rounded-md border border-border/40 bg-card"
  >
    <div data-spot-stats-cell="base" className="flex-1 min-w-0 flex items-center gap-1.5 px-2">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">Base</span>
      <span className="text-[12px] font-mono shrink-0">
        {t.basePrice != null ? `${t.cur}${money2(t.basePrice)}` : "—"}
      </span>
      {t.indicative != null && sessionPill(t.sessionTag) && (
        <span className="shrink-0 rounded px-1 border border-border/60 text-[9px] font-semibold tracking-wide text-muted-foreground">
          {sessionPill(t.sessionTag)}
        </span>
      )}
    </div>
    <div className="w-px h-5 bg-border/40" />
    <div data-spot-stats-cell="market" className="flex-1 min-w-0 flex items-baseline gap-1 px-2">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">{t.ticker || "Last"}</span>
      <span className="text-[12px] font-mono shrink-0">
        {t.indicative != null ? `${t.cur}${money2(t.indicative)}` : "—"}
      </span>
      {t.indicative != null && showPercent && (
        <span
          className={cn(
            // SP-2-FIX3: visibility follows the strip's own width, not viewport width.
            "text-[12px] font-mono whitespace-nowrap shrink-0",
            t.indicativePct >= 0 ? "text-trading-green" : "text-trading-red",
          )}
        >
          {t.indicativePct >= 0 ? "+" : ""}
          {t.indicativePct.toFixed(2)}%
        </span>
      )}
    </div>
  </div>
  );
};

/** Mark line above the mobile chart. */
export const SpotMobileMarkLine = ({ t }: { t: SpotTerminal }) => (
  <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/20">
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono tracking-tight">{t.outcomePrice.toFixed(4)}</span>
        <span className={cn("text-sm font-mono", t.indicativePct >= 0 ? "text-trading-green" : "text-trading-red")}>
          ({t.indicativePct >= 0 ? "+" : ""}{t.indicativePct.toFixed(2)}%)
        </span>
      </div>
      <div className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
        <span>{TRADING_TERMS.MARK_PRICE} {t.outcomePrice.toFixed(4)}</span>
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide",
          t.isYesSelected ? "bg-yes/15 text-yes" : "bg-no/15 text-no",
        )}>
          {t.outcomeLabel}
        </span>
      </div>
    </div>
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-right justify-end">
        <span className="text-[10px] text-muted-foreground">24h Volume</span>
        <span className="font-mono text-xs font-semibold text-foreground">{mock24hVolume(t.event?.id ?? "spot")}</span>
      </div>
    </div>
  </div>
);

/** SP-2-FIX5 · contract-parity 120px inline order book. */
export const SpotMiniOrderBook = ({
  asks,
  bids,
  price,
}: {
  asks: { price: string; amount: string }[];
  bids: { price: string; amount: string }[];
  price: number;
}) => {
  const fillLevels = (rows: { price: string; amount: string }[], direction: 1 | -1) => {
    if (rows.length >= 10) return rows.slice(0, 10);
    const filled = [...rows];
    const fallback = rows[rows.length - 1] ?? { price: price.toFixed(4), amount: "0" };
    while (filled.length < 10) {
      const nextPrice = Math.min(0.9999, Math.max(0.0001, Number(fallback.price) + direction * 0.01 * (filled.length - rows.length + 1)));
      filled.push({ price: nextPrice.toFixed(4), amount: fallback.amount });
    }
    return filled;
  };
  const displayAsks = fillLevels(asks, 1);
  const displayBids = fillLevels(bids, -1);
  return (
  <div className="w-[120px] flex-shrink-0 border-l border-border/30">
    <div className="px-1.5 py-1.5">
      <div className="grid grid-cols-2 text-[9px] text-muted-foreground mb-1">
        <span>Price</span>
        <span className="text-right">Amount</span>
      </div>
    </div>
    <div className="overflow-y-auto scrollbar-hide">
      {displayAsks.map((ask, index) => (
        <div key={`ask-${index}`} className="flex justify-between px-1.5 py-0.5 text-[10px]">
          <span className="price-red">{ask.price}</span>
          <span className="text-muted-foreground font-mono">{ask.amount}</span>
        </div>
      ))}
    </div>
    <div className="px-1.5 py-1.5 text-center">
      <span className="text-sm font-bold font-mono">{price.toFixed(4)}</span>
    </div>
    <div className="overflow-y-auto scrollbar-hide">
      {displayBids.map((bid, index) => (
        <div key={`bid-${index}`} className="flex justify-between px-1.5 py-0.5 text-[10px]">
          <span className="price-green">{bid.price}</span>
          <span className="text-muted-foreground font-mono">{bid.amount}</span>
        </div>
      ))}
    </div>
    <div className="flex items-center justify-between px-1.5 py-1.5 border-t border-border/30 mt-1">
      <span className="text-[9px] text-muted-foreground">Depth</span>
      <button type="button" className="flex items-center gap-0.5 text-[10px]">
        0.1
        <ChevronDown className="w-2.5 h-2.5" />
      </button>
    </div>
  </div>
  );
};
