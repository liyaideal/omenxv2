// ============================================================
// /spot/order (mobile, Pro) — SP-2 · B3 Trade view.
// Same skeleton as `/trade/order`: the production `ProSpotPanel` on
// the left, a 120px mini order book on the right, Orders/Positions
// below. No sticky dock and no Lite/Pro switch on this sub-page.
// ============================================================
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MobileTradingLayout } from "@/components/MobileTradingLayout";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { AuthDialog } from "@/components/auth/AuthDialog";
import {
  SpotTradePanel,
  SpotOrderPreviewDialog,
  SpotEventInfoPanel,
  SpotPositionsTable,
  SpotOrdersTable,
  SpotMiniOrderBook,
  SpotScheduleInfo,
  SpotHeaderActions,
  spotHeaderEvent,
  spotMobileTitle,
} from "@/components/pro/ProSpotShared";
import { useSpotTerminal, type SpotTerminal } from "@/hooks/useSpotTerminal";

function SpotOrderBody({ t }: { t: SpotTerminal }) {
  const [tab, setTab] = useState<"Orders" | "Positions">("Positions");

  return (
    <div className="pb-8">
      <div className="flex">
        {/* Left: the very same panel desktop /spot renders */}
        <div className="flex-1 min-w-0">
          <SpotTradePanel t={t} chrome="bare" />
        </div>

        {/* Right: mini order book */}
        <SpotMiniOrderBook asks={t.book.asks} bids={t.book.bids} price={t.outcomePrice} />
      </div>

      {/* Orders / Positions */}
      <div className="flex px-4 mt-2 border-b border-border/30">
        {(["Orders", "Positions"] as const).map((x) => {
          const count = x === "Orders" ? t.spotOrders.length : t.spotPositions.length;
          return (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={`py-2 mr-6 text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === x
                  ? "text-trading-purple border-b-2 border-trading-purple"
                  : "text-muted-foreground"
              }`}
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

      <LiteAuthGate
        variant="panel"
        title="Sign in to view spot positions"
        description="Track your open positions and orders by signing in to your account."
      >
        {tab === "Orders" ? (
          <SpotOrdersTable t={t} variant="mobile" />
        ) : (
          <SpotPositionsTable t={t} variant="mobile" />
        )}
      </LiteAuthGate>

      <SpotOrderPreviewDialog t={t} />
      <AuthDialog open={t.authOpen} onOpenChange={t.setAuthOpen} defaultTab="signup" />
    </div>
  );
}

export default function SpotTradeOrder() {
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
      activeTab="Trade"
      basePath="/spot"
      variant="spot"
      event={{ ...spotHeaderEvent(t), name: spotMobileTitle(t) }}
      countdownText={t.countdown.text}
      countdownLabel="Trading ends in"
      countdownUrgency={t.countdown.urgency}
      statsExtra={<SpotScheduleInfo t={t} />}
      eventInfo={<SpotEventInfoPanel t={t} />}
      headerRight={<SpotHeaderActions t={t} />}
    >
      <SpotOrderBody t={t} />
    </MobileTradingLayout>
  );
}
