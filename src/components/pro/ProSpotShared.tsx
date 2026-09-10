// ============================================================
// SP-2 · shared render blocks for the Pro SPOT terminal.
// Desktop `/spot`, mobile `/spot` and mobile `/spot/order` all render
// these — there is exactly one implementation of the trade panel,
// order preview, account panel, event info and the positions/orders
// tables. Desktop markup is unchanged from SpotTrading.tsx.
// ============================================================
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EventInfoContent } from "@/components/EventInfoContent";
import {
  ProSpotPanel,
  ProSpotAccountPanel,
  ProSpotOrderPreview,
} from "@/components/pro/ProSpotPanel";
import { ProBottomTabs } from "@/components/pro/ProBottomTabs";
import { mock24hVolume, type SpotTerminal } from "@/hooks/useSpotTerminal";
import type { TradingEvent } from "@/hooks/useEvents";

export const SpotTradePanel = ({ t }: { t: SpotTerminal }) => (
  <ProSpotPanel
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
    spotBalance={t.spotBalance}
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
          value={t.basePrice != null ? `${t.cur}${t.basePrice.toFixed(2)}` : "—"}
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
      <div className="text-xs">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">No open spot positions.</div>
        ) : (
          rows.map((p) => {
            const isYes = p.optionId ? p.optionId === t.yesOpt?.id : t.isYesLabel(p.option);
            return (
              <div key={p.id} className="px-3 py-2.5 border-b border-border/20 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium",
                      isYes
                        ? "bg-yes/15 text-yes"
                        : "bg-no/15 text-no",
                    )}
                  >
                    {isYes ? t.yesLabel : t.noLabel}
                  </span>
                  <span className="truncate flex-1 min-w-0">{p.event}</span>
                  <button
                    onClick={() => t.closePosition(p)}
                    className="text-[11px] text-primary hover:underline flex-shrink-0"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                  <div>
                    <div>Entry</div>
                    <div className="font-mono text-foreground">{p.entryPrice}</div>
                  </div>
                  <div>
                    <div>Mark</div>
                    <div className="font-mono text-foreground">{p.markPrice}</div>
                  </div>
                  <div>
                    <div>Size (sh)</div>
                    <div className="font-mono text-foreground">{p.sizeDisplay}</div>
                  </div>
                  <div className="text-right">
                    <div>PnL</div>
                    <div
                      className={cn(
                        "font-mono",
                        p.pnl.startsWith("+") ? "text-trading-green" : "text-trading-red",
                      )}
                    >
                      {p.pnl}
                    </div>
                  </div>
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
        <div className="px-4 py-8 text-center text-muted-foreground">No open spot positions.</div>
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
              <span className="text-right font-mono">{p.sizeDisplay}</span>
              <span
                className={cn(
                  "text-right font-mono",
                  p.pnl.startsWith("+") ? "text-trading-green" : "text-trading-red",
                )}
              >
                {p.pnl}
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
      <div className="text-xs">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">No open spot orders.</div>
        ) : (
          rows.map((o, i) => {
            const isPending = o.status === "Pending";
            return (
              <div key={o.id ?? i} className="px-3 py-2.5 border-b border-border/20 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "uppercase text-[10px] font-medium",
                      o.type === "buy" ? "text-trading-green" : "text-trading-red",
                    )}
                  >
                    {o.type}
                  </span>
                  <span className="truncate flex-1 min-w-0">{o.event}</span>
                  <button
                    disabled={t.isCancelling || !isPending}
                    onClick={() => t.handleCancelSpotOrder(o)}
                    className="text-[11px] text-trading-red hover:underline disabled:opacity-40 disabled:no-underline flex-shrink-0"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                  <div>
                    <div>Type</div>
                    <div className="text-foreground">{o.orderType}</div>
                  </div>
                  <div>
                    <div>Limit</div>
                    <div className="font-mono text-foreground">{o.price}</div>
                  </div>
                  <div>
                    <div>Qty (sh)</div>
                    <div className="font-mono text-foreground">{o.amount}</div>
                  </div>
                  <div className="text-right">
                    <div>Status</div>
                    <div className={cn(isPending ? "text-trading-yellow" : "text-muted-foreground")}>
                      {o.id && t.frozenCancelledIds.has(o.id) ? "Cancelled · market frozen" : o.status}
                    </div>
                  </div>
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
        <div className="px-4 py-8 text-center text-muted-foreground">No open spot orders.</div>
      ) : (
        rows.map((o, i) => {
          const reserved = o.type === "buy" ? o.total : "—";
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
              <span className="text-right font-mono">{o.amount}</span>
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
      { key: "Orders", label: "Orders", count: t.spotOrders.length },
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
import { Info, Star, Share2 } from "lucide-react";
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
      <div className="space-y-1">
        <div><span className="text-muted-foreground">Opens:</span> after prior close (extended trading)</div>
        <div><span className="text-muted-foreground">Trading ends:</span> {t.freezeEtOnly ?? "—"}</div>
        <div><span className="text-muted-foreground">Official close:</span> {t.closeEtOnly ?? "—"} (settlement price)</div>
        <div><span className="text-muted-foreground">Credits by:</span> ~{t.settleEtOnly ?? "—"}</div>
      </div>
    </PopoverContent>
  </Popover>
);

/** 32 px two-cell stats strip — SP-2 mobile spot exception to the perp grid. */
export const SpotMobileStatsStrip = ({ t }: { t: SpotTerminal }) => (
  <div className="mx-3 my-2 h-8 flex items-center rounded-md border border-border/40 bg-card">
    <div className="flex-1 min-w-0 flex items-center gap-1.5 px-2">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Base</span>
      <span className="text-[12px] font-mono truncate">
        {t.basePrice != null ? `${t.cur}${t.basePrice.toFixed(2)}` : "—"}
      </span>
    </div>
    <div className="w-px h-5 bg-border/40" />
    <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden px-2">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.ticker || "Last"}</span>
      <span className="text-[12px] font-mono truncate">
        {t.indicative != null ? `${t.cur}${t.indicative.toFixed(2)}` : "—"}
      </span>
      {t.indicative != null && (
        <span
          className={cn(
            "text-[12px] font-mono whitespace-nowrap",
            t.indicativePct >= 0 ? "text-trading-green" : "text-trading-red",
          )}
        >
          {t.indicativePct >= 0 ? "+" : ""}
          {t.indicativePct.toFixed(2)}%
          {t.sessionTag ? ` · ${t.sessionTag}` : ""}
        </span>
      )}
    </div>
  </div>
);

/** Mark line above the mobile chart. */
export const SpotMobileMarkLine = ({ t }: { t: SpotTerminal }) => (
  <div className="flex items-baseline gap-2 px-3 pb-2">
    <span className="text-2xl font-bold font-mono">{t.outcomePrice.toFixed(4)}</span>
    <span className="text-[11px] text-muted-foreground">{t.outcomeLabel} · mark</span>
  </div>
);
