// ============================================================
// /spot (mobile, Pro) — SP-2 · B2 Charts view.
// Built on the contract Pro mobile skeleton (`MobileTradingLayout`,
// variant="spot", basePath="/spot"): context + chart + tabs on this
// page, the order form on the `/spot/order` sub-page.
// ============================================================
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { MobileTradingLayout } from "@/components/MobileTradingLayout";
import { OptionChips } from "@/components/OptionChips";
import { CandlestickChart } from "@/components/CandlestickChart";
import { OrderBook } from "@/components/OrderBook";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { ProSpotMobileDock } from "@/components/pro/ProSpotMobileDock";
import {
  SpotOrderPreviewDialog,
  SpotEventInfoPanel,
  SpotPositionsTable,
  SpotOrdersTable,
  SpotMobileStatsStrip,
  SpotMobileMarkLine,

  SpotScheduleInfo,
  SpotHeaderActions,
  spotHeaderEvent,
  spotMobileTitle,
} from "@/components/pro/ProSpotShared";
import { useSpotTerminal, type SpotTerminal } from "@/hooks/useSpotTerminal";
import { useAnimatedTradesHistory } from "@/hooks/useAnimatedTradesHistory";
import { useTradeSideStore, tradeSideKey } from "@/stores/useTradeSideStore";
import { cn } from "@/lib/utils";

const TABS = ["Order Book", "Trades history", "Orders", "Positions"] as const;

function SpotChartsBody({ t }: { t: SpotTerminal }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Order Book");

  // Two-stage tap shares the same store the perp dock uses.
  const sideKey = tradeSideKey(t.event!.id, "spot");
  const storedSide = useTradeSideStore((s) => s.sideByKey[sideKey]);
  const setSide = useTradeSideStore((s) => s.setSide);
  const selected: "yes" | "no" =
    storedSide === "buy" ? "yes" : storedSide === "sell" ? "no" : t.isYesSelected ? "yes" : "no";

  const { trades, newTradeIndex } = useAnimatedTradesHistory({
    basePrice: t.outcomePrice || 0.5,
    initialCount: 20,
    newTradeInterval: 1200,
  });

  const handleTap = (which: "yes" | "no") => {
    if (selected !== which) {
      setSide(sideKey, which === "yes" ? "buy" : "sell");
      t.onSelectOutcome(which);
      return;
    }
    navigate(`/spot/order?event=${t.event!.id}`);
  };

  const counts = useMemo(
    () => ({ Orders: t.spotOrders.length, Positions: t.spotPositions.length }),
    [t.spotOrders.length, t.spotPositions.length],
  );

  return (
    <div className="pb-40">
      <SpotMobileStatsStrip t={t} />

      {/* Mark line */}
      <SpotMobileMarkLine t={t} />


      <div className="h-[450px] w-full min-w-0 overflow-hidden">
        <CandlestickChart basePrice={t.outcomePrice || 0.5} side={t.isYesSelected ? "buy" : "sell"} />
      </div>

      {/* Bottom tabs */}
      <div className="flex px-4 mt-2 border-b border-border/30">
        {TABS.map((x) => {
          const count = x === "Orders" || x === "Positions" ? counts[x] : 0;
          return (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={cn(
                "py-3 mr-4 text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                tab === x ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground",
              )}
            >
              {x}
              {count > 0 && (
                <span className="bg-primary/20 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "Order Book" && (
        <OrderBook
          asks={t.book.asks.map((row) => ({ ...row, price: Number(row.price).toFixed(4) }))}
          bids={t.book.bids.map((row) => ({ ...row, price: Number(row.price).toFixed(4) }))}
          currentPrice={t.outcomePrice.toFixed(4)}
        />
      )}

      {tab === "Trades history" && (
        <div className="px-4">
          <div className="grid grid-cols-3 text-xs text-muted-foreground py-2">
            <span>Price (USDT)</span>
            <span className="text-center">Amount</span>
            <span className="text-right">Time</span>
          </div>
          <div className="space-y-0">
            {trades.map((trade, index) => (
              <div
                key={`${trade.time}-${index}`}
                className={cn(
                  "grid grid-cols-3 text-xs py-1.5 transition-all duration-300",
                  index === newTradeIndex &&
                    (trade.isBuy ? "bg-trading-green/25 animate-fade-in" : "bg-trading-red/25 animate-fade-in"),
                )}
              >
                <span className={cn(
                  "font-mono transition-all duration-200",
                  trade.isBuy ? "text-trading-green" : "text-trading-red",
                  index === newTradeIndex && "font-semibold",
                )}>
                  {trade.price}
                </span>
                <span className={cn(
                  "text-center font-mono transition-all duration-200",
                  index === newTradeIndex ? "text-foreground" : "text-muted-foreground",
                )}>{trade.amount}</span>
                <span className={cn(
                  "text-right font-mono transition-all duration-200",
                  index === newTradeIndex ? "text-foreground" : "text-muted-foreground",
                )}>{trade.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Orders" && <SpotOrdersTable t={t} variant="mobile" />}
      {tab === "Positions" && <SpotPositionsTable t={t} variant="mobile" />}

      <ProSpotMobileDock
        available={t.available}
        yesLabel={t.yesLabel}
        noLabel={t.noLabel}
        yesPrice={t.yesLive}
        noPrice={t.noLive}
        selected={selected}
        onTap={handleTap}
        blocked={t.blocked}
        blockedReason={t.blockedReason}
      />

      <SpotOrderPreviewDialog t={t} />
      <AuthDialog open={t.authOpen} onOpenChange={t.setAuthOpen} defaultTab="signup" />
    </div>
  );
}

export default function SpotTradingCharts() {
  const t = useSpotTerminal();

  if (t.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (t.notFound || !t.event) return <ExpiredEventFallback eventId={t.eventId} />;

  return (
    <MobileTradingLayout
      activeTab="Charts"
      basePath="/spot"
      variant="spot"
      event={{ ...spotHeaderEvent(t), name: spotMobileTitle(t) }}
      countdownText={t.countdown.text}
      countdownLabel="Trading ends in"
      countdownUrgency={t.countdown.urgency}
      statsExtra={<SpotScheduleInfo t={t} />}
      eventInfo={<SpotEventInfoPanel t={t} />}
      headerRight={<SpotHeaderActions t={t} />}
      optionChips={t.yesOpt && t.noOpt ? (
        <OptionChips
          options={[
            { id: t.yesOpt.id, label: t.yesLabel, price: t.yesLive.toFixed(4) },
            { id: t.noOpt.id, label: t.noLabel, price: t.noLive.toFixed(4) },
          ]}
          selectedId={t.selectedOption?.id ?? t.yesOpt.id}
          onSelect={(id) => {
            t.setSelectedOptionId(id);
            useTradeSideStore.getState().setSide(
              tradeSideKey(t.event!.id, "spot"),
              id === t.yesOpt?.id ? "buy" : "sell",
            );
          }}
        />
      ) : null}
    >
      <SpotChartsBody t={t} />
    </MobileTradingLayout>
  );
}
