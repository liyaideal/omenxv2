// ============================================================
// /spot/order (mobile, Pro) — SP-2 · B3 Trade view.
// Same skeleton as `/trade/order`: the production `ProSpotPanel` on
// the left, a 120px mini order book on the right, Orders/Positions
// below. No sticky dock and no Lite/Pro switch on this sub-page.
// ============================================================
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MobileTradingLayout } from "@/components/MobileTradingLayout";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { AuthDialog } from "@/components/auth/AuthDialog";
import {
  SpotTradePanel,
  SpotOrderPreviewDialog,
  SpotEventInfoPanel,
  SpotPositionsTable,
  SpotOrdersTable,
  SpotScheduleInfo,
  spotHeaderEvent,
} from "@/components/pro/ProSpotShared";
import { useSpotTerminal, type SpotTerminal } from "@/hooks/useSpotTerminal";
import { cn } from "@/lib/utils";

function SpotOrderBody({ t }: { t: SpotTerminal }) {
  const [tab, setTab] = useState<"Orders" | "Positions">("Positions");

  return (
    <div className="pb-8">
      <div className="flex">
        {/* Left: the very same panel desktop /spot renders */}
        <div className="flex-1 min-w-0">
          <SpotTradePanel t={t} />
        </div>

        {/* Right: mini order book */}
        <div className="w-[120px] flex-shrink-0 border-l border-border/30">
          <div className="px-1.5 py-1.5">
            <div className="grid grid-cols-2 text-[9px] text-muted-foreground mb-1">
              <span>Price</span>
              <span className="text-right">Amount</span>
            </div>
          </div>
          <div className="overflow-y-auto scrollbar-hide">
            {t.book.asks.slice(0, 8).map((ask, index) => (
              <div key={`ask-${index}`} className="flex justify-between px-1.5 py-0.5 text-[10px]">
                <span className="price-red">{ask.price}</span>
                <span className="text-muted-foreground font-mono">{ask.amount}</span>
              </div>
            ))}
          </div>
          <div className="px-1.5 py-1.5 text-center">
            <span className="text-sm font-bold font-mono">{t.outcomePrice.toFixed(4)}</span>
          </div>
          <div className="overflow-y-auto scrollbar-hide">
            {t.book.bids.slice(0, 8).map((bid, index) => (
              <div key={`bid-${index}`} className="flex justify-between px-1.5 py-0.5 text-[10px]">
                <span className="price-green">{bid.price}</span>
                <span className="text-muted-foreground font-mono">{bid.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders / Positions */}
      <div className="flex px-4 mt-2 border-b border-border/30">
        {(["Orders", "Positions"] as const).map((x) => {
          const count = x === "Orders" ? t.spotOrders.length : t.spotPositions.length;
          return (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={cn(
                "py-3 mr-6 text-sm font-medium transition-all flex items-center gap-1.5",
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

      <AuthGateOverlay
        title="Sign in to view spot positions"
        description="Log in or create an account to view your open positions and orders."
        compact
      >
        {tab === "Orders" ? (
          <SpotOrdersTable t={t} variant="mobile" />
        ) : (
          <SpotPositionsTable t={t} variant="mobile" />
        )}
      </AuthGateOverlay>

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
      event={spotHeaderEvent(t)}
      endTime={t.freezeAt ?? t.endDate ?? undefined}
      countdownLabel="Trading ends in"
      countdownUrgency={t.countdown.urgency}
      statsExtra={<SpotScheduleInfo t={t} />}
      eventInfo={<SpotEventInfoPanel t={t} />}
    >
      <SpotOrderBody t={t} />
    </MobileTradingLayout>
  );
}
